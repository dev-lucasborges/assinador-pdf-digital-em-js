# Assinador de PDF's em JS

[em breve, capturas de tela]

Tipos de assinturas suportadas: desenho, upload de img, digitada.

A ideia do assinador é ser um ponto de partida para que você modifique e torne-a parte de sua aplicação.
O design é simples, a ideia foi focar nas funcionalidades.
O projeto também é muito simples, via js/jquery e html.

# O que funciona?

- Assinar PDF's com várias páginas e orientações.
- Assinar via "draw" (o usuário pode desenhar a assinatura e escolher a cor da linha).
- Assinar via imagem, ou seja, o usuário pode baixar a assinatura dele de outro lugar e importar para assinar.
- Assinar via texto, o usuário pode digitar o nome dele e escolher a fonte (fique à vontade para adicionar mais opções).
- O usuário pode mover e redimencionar a assinatura livremente.
- Para excluir uma assinatura, basta selecionar a assinatura e clicar backspace ou del.

# Possiveis melhorias:

- Exporar pdf com texto selecionável (hoje o PDF é convertido em imagem para renderizar).
- Inserir certificado no PDF.
- Ter a possibilidade de girar a assinatura.
- Inserir uma aba lateral com as camadas e com todas assinaturas que estão presentes no documento.

# O que eu recomendo para você adaptar e implementar no seu projeto?

- Gerar um hash, inserir no footer do documento e em um banco de dados para validar posteriormente.

# Como usar?

Basta clonar o repositório e iniciar o "live server".
