# Caseirinho Loja V8.6.1

- CEP automático no checkout/cadastro do pedido: Rua, Bairro, Cidade e UF são preenchidos e bloqueados; cliente informa Número e Complemento opcional.
- Consulta CEP tenta ViaCEP no navegador e usa proxy da API como fallback; a API valida novamente o CEP ao gravar o pedido.
- Pedido usa uma única chamada de gravação (o pré-cadastro é criado pelo próprio endpoint do pedido).
- `clientRequestId` permite reenvio seguro sem duplicar pedido quando a conexão cai após a gravação.
- Em erro de rede, carrinho e pedido pendente são preservados e há botão Tentar enviar novamente.
- Não mostra mais `Failed to fetch` cru ao cliente.
- Catálogo usa heartbeat leve de versão e só baixa o catálogo completo quando ele realmente muda.
- Mantidas regras de Frete, PIX, LGPD, descrição, categoria e aviso de imagem meramente ilustrativa.
