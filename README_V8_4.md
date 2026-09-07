# Caseirinho Loja / E-commerce — V8.4 Estável

Data: 07/09/2026

- Cache PWA identificado como V8.4.
- API continua sempre consultada com `no-store`; Service Worker não intercepta dados da API.
- Último catálogo válido é mantido como contingência de visualização.
- Ao receber catálogo novo sem imagem de um produto que já possuía imagem válida em cache, a Loja mantém a última imagem conhecida até a nuvem voltar a fornecê-la.
- O catálogo oficial continua vindo da API/PostgreSQL; o cache local é somente contingência de apresentação.
- Ícones PWA adicionados ao pacote final e cache do Service Worker atualizado para V8.4 FINAL.
- Manifesto atualizado para instalação standalone no celular/tablet/PC.
