// -------- seletores -------- //
// input para upload do documento
const documentUpload = $("#documentUpload")[0];

// canva do pdf para capturar as dimensões do documento
const pdfCanvas = $("#pdfCanvas")[0];
const pdfCtx = pdfCanvas.getContext("2d");

// canva para assinatura desenhada
const drawCanvas = $("#drawCanvas")[0];
const drawCtx = drawCanvas.getContext("2d");

// seletores de cor e botão para limpar assinatura desenhada
const colorSelector = $("#colorSelector")[0];
const clearSignature = $("#clearSignature")[0];

// input para upload de assinatura via img
const uploadSignature = $("#uploadSignature")[0];

// campo de assinatura digitada e seletor de fonte
const typedSignature = $("#typedSignature")[0];
const fontSelector = $("#fontSelector")[0];

// botão para finalizar a assinatura (botão de concluir dentro do modal de adicionar assinatura)
const finishSignatureButton = $("#finishSignature")[0];

// botão para salvar o pdf com as assinaturas
const savePdfButton = $("#savePdf")[0];

// botões de navegação
const prevPageButton = $("#prevPage")[0];
const nextPageButton = $("#nextPage")[0];

// display de página atual e total de páginas
const pageNumDisplay = $("#pageNum")[0];
const pageCountDisplay = $("#pageCount")[0];

// inicialização de variáveis
let pdfDoc = null,
  currentPage = 1,
  rendering = false,
  signatures = [],
  selectedSignature = null,
  isDragging = false,
  dragOffset = { x: 0, y: 0 },
  isResizing = false,
  selectedCorner = null,
  drawing = false;

// config do pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

// capurando o envio do PDF via onchange
$(documentUpload).on("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const pdfData = new Uint8Array(e.target.result);
      pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
      totalPages = pdfDoc.numPages;

      $(pageCountDisplay).text(totalPages);
      currentPage = 1;

      for (let i = 1; i <= totalPages; i++) {
        signatures[i] = [];
      }

      renderPage(currentPage);
    };
    reader.readAsArrayBuffer(file);
  }
});

$(signatureCanvas).on("mousedown", (e) => {
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;

  selectedSignature = null;
  selectedCorner = null;

  let clickedInsideSignature = false;

  signatures[currentPage].forEach((sig, index) => {
    const handleSize = 10;

    const corners = [
      { x: sig.x, y: sig.y },
      { x: sig.x + sig.width, y: sig.y },
      { x: sig.x, y: sig.y + sig.height },
      { x: sig.x + sig.width, y: sig.y + sig.height },
    ];

    corners.forEach((corner, cornerIndex) => {
      if (
        mouseX >= corner.x - handleSize / 2 &&
        mouseX <= corner.x + handleSize / 2 &&
        mouseY >= corner.y - handleSize / 2 &&
        mouseY <= corner.y + handleSize / 2
      ) {
        isResizing = true;
        selectedSignature = index;
        selectedCorner = cornerIndex;
        clickedInsideSignature = true;
      }
    });

    if (
      !isResizing &&
      mouseX >= sig.x &&
      mouseX <= sig.x + sig.width &&
      mouseY >= sig.y &&
      mouseY <= sig.y + sig.height
    ) {
      isDragging = true;
      selectedSignature = index;
      dragOffset.x = mouseX - sig.x;
      dragOffset.y = mouseY - sig.y;
      clickedInsideSignature = true;
    }
  });

  if (!clickedInsideSignature) {
    selectedSignature = null;
  }

  renderSignatures();
});

$(signatureCanvas).on("mousemove", (e) => {
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;

  if (isResizing && selectedSignature !== null) {
    const sig = signatures[currentPage][selectedSignature];

    const deltaX = mouseX - sig.x;
    const deltaY = mouseY - sig.y;

    const aspectRatio = sig.width / sig.height;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      sig.width = deltaX;
      sig.height = deltaX / aspectRatio;
    } else {
      sig.height = deltaY;
      sig.width = deltaY * aspectRatio;
    }

    renderSignatures();
  } else if (isDragging && selectedSignature !== null) {
    const sig = signatures[currentPage][selectedSignature];

    sig.x = mouseX - dragOffset.x;
    sig.y = mouseY - dragOffset.y;

    renderSignatures();
  }
});

$(signatureCanvas).on("mouseup", () => {
  isDragging = false;
  isResizing = false;
  selectedCorner = null;
});

function isMouseOnHandle(mouseX, mouseY, signature) {
  const handleSize = 8;
  const corners = [
    { x: signature.x, y: signature.y }, // top-left
    { x: signature.x + signature.width, y: signature.y }, // top-right
    { x: signature.x, y: signature.y + signature.height }, // bottom-left
    { x: signature.x + signature.width, y: signature.y + signature.height }, // bottom-right
  ];

  return (
    $.grep(
      corners,
      (corner) =>
        mouseX >= corner.x - handleSize / 2 &&
        mouseX <= corner.x + handleSize / 2 &&
        mouseY >= corner.y - handleSize / 2 &&
        mouseY <= corner.y + handleSize / 2
    ).length > 0
  );
}

function renderPage(pageNum) {
  if (rendering) return;
  rendering = true;

  pdfDoc.getPage(pageNum).then((page) => {
    const viewport = page.getViewport({ scale: 2 }); // Fator de escala
    $(pdfCanvas).attr({ width: viewport.width, height: viewport.height });
    $(signatureCanvas).attr({ width: viewport.width, height: viewport.height });

    // Salve o fator de escala e as dimensões para ajustar no salvamento
    $(pdfCanvas).data("scale", viewport.scale);
    $(pdfCanvas).data("width", viewport.width);
    $(pdfCanvas).data("height", viewport.height);

    const renderContext = {
      canvasContext: pdfCtx,
      viewport: viewport,
    };

    page.render(renderContext).promise.then(() => {
      rendering = false;
      $(pageNumDisplay).text(pageNum);
      renderSignatures();
    });
  });
}

$(clearSignature).on("click", () => {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
});

function renderSignatures() {
  const signatureCtx = $(signatureCanvas)[0].getContext("2d");

  signatureCtx.clearRect(
    0,
    0,
    $(signatureCanvas).width(),
    $(signatureCanvas).height()
  );

  signatures[currentPage].forEach((sig, index) => {
    signatureCtx.drawImage(sig.image, sig.x, sig.y, sig.width, sig.height);

    if (index === selectedSignature) {
      signatureCtx.strokeStyle = "red";
      signatureCtx.lineWidth = 2;
      signatureCtx.strokeRect(sig.x, sig.y, sig.width, sig.height);
    }

    drawHandles(signatureCtx, sig);
  });
}

$(document).on("keydown", (e) => {
  if (
    selectedSignature !== null &&
    (e.key === "Delete" || e.key === "Backspace")
  ) {
    if (signatures[currentPage] && signatures[currentPage][selectedSignature]) {
      signatures[currentPage].splice(selectedSignature, 1);
      selectedSignature = null;
      renderSignatures();
    }
  }
});

function drawHandles(ctx, signature) {
  const handleSize = 10;
  const corners = [
    { x: signature.x, y: signature.y }, // top-left
    { x: signature.x + signature.width, y: signature.y }, // top-right
    { x: signature.x, y: signature.y + signature.height }, // bottom-left
    { x: signature.x + signature.width, y: signature.y + signature.height }, // bottom-right
  ];

  ctx.fillStyle = "blue";
  $.each(corners, (index, corner) => {
    ctx.fillRect(
      corner.x - handleSize / 2,
      corner.y - handleSize / 2,
      handleSize,
      handleSize
    );
  });
}

$(prevPageButton).on("click", () => {
  if (currentPage <= 1) return;
  currentPage--;
  renderPage(currentPage);
});

$(nextPageButton).on("click", () => {
  if (currentPage >= totalPages) return;
  currentPage++;
  renderPage(currentPage);
});

$(finishSignatureButton).on("click", () => {
  const activeTab = $(".nav-link.active").attr("id");

  if (activeTab === "draw-tab") {
    const signatureImage = new Image();
    signatureImage.src = drawCanvas.toDataURL("image/png");
    $(signatureImage).on("load", () => {
      addSignature(signatureImage);
    });
  } else if (activeTab === "upload-tab") {
    const file = uploadSignature.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const signatureImage = new Image();
        signatureImage.src = e.target.result;
        $(signatureImage).on("load", () => {
          addSignature(signatureImage);
        });
      };
      reader.readAsDataURL(file);
    }
  } else if (activeTab === "text-tab") {
    const text = $(typedSignature).val();
    const font = $(fontSelector).val();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    ctx.font = `48px ${font}`;
    const textWidth = ctx.measureText(text).width;
    canvas.width = textWidth + 20;
    canvas.height = 60;

    ctx.font = `48px ${font}`;
    ctx.fillText(text, 10, 50);

    const signatureImage = new Image();
    signatureImage.src = drawCanvas.toDataURL("image/png");
    $(signatureImage).on("load", () => {
      addSignature(signatureImage);
    });
  }

  const modal = bootstrap.Modal.getInstance($("#signatureModal")[0]);
  modal.hide();
});

function addSignature(signatureImage) {
  const aspectRatio = signatureImage.width / signatureImage.height;
  const signature = {
    image: signatureImage,
    x: 50,
    y: 50,
    width: 100,
    height: 100 / aspectRatio,
  };

  if (!signatures[currentPage]) {
    signatures[currentPage] = [];
  }

  signatures[currentPage].push(signature);
  renderSignatures();
}

$(drawCanvas).on("mousedown", (e) => {
  drawing = true;
  const selectedColor = $('input[name="colorOptions"]:checked').val();
  drawCtx.strokeStyle = selectedColor;
  drawCtx.lineWidth = 2;
  drawCtx.beginPath();
  drawCtx.moveTo(e.offsetX, e.offsetY);
});

$(drawCanvas).on("mousemove", (e) => {
  if (!drawing) return;
  drawCtx.lineTo(e.offsetX, e.offsetY);
  drawCtx.stroke();
});

$(drawCanvas).on("mouseup", () => {
  drawing = false;
});

$(savePdfButton).on("click", async () => {
  const { PDFDocument } = PDFLib;

  // Carregar o PDF original
  const pdfBytes = await pdfDoc.getData();
  const loadedPdf = await PDFDocument.load(pdfBytes);

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = loadedPdf.getPage(pageNum - 1);

    const { width: pdfWidth, height: pdfHeight } = page.getSize();
    const canvasScale = $(pdfCanvas).data("scale") || 1;
    const canvasWidth = $(pdfCanvas).data("width");
    const canvasHeight = $(pdfCanvas).data("height");

    if (signatures[pageNum]) {
      for (const sig of signatures[pageNum]) {
        try {
          const signatureImage = sig.image.src.split(",")[1];

          if (!signatureImage) continue;

          const imageBytes = new Uint8Array(
            atob(signatureImage)
              .split("")
              .map((char) => char.charCodeAt(0))
          );

          const embeddedImage = await loadedPdf.embedPng(imageBytes);

          const x = (sig.x / canvasWidth) * pdfWidth;
          const y =
            pdfHeight -
            (sig.y / canvasHeight) * pdfHeight -
            (sig.height / canvasHeight) * pdfHeight;
          const width = (sig.width / canvasWidth) * pdfWidth;
          const height = (sig.height / canvasHeight) * pdfHeight;

          page.drawImage(embeddedImage, {
            x,
            y,
            width,
            height,
          });
        } catch (error) {
          console.error("Erro ao adicionar assinatura:", error);
        }
      }
    }
  }

  const pdfData = await loadedPdf.save();
  const blob = new Blob([pdfData], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "documento_assinado.pdf";
  link.click();
});
