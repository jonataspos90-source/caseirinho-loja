# Caseirinho Loja/App V8.9.2

## Principais correções
- CEP consulta primeiro a John Cloud API e usa ViaCEP apenas como contingência.
- Frete suporta Bairro exato, Cidade, CEP exato, Prefixo, Faixa de CEP e Raio em KM.
- Bairro não utiliza mais correspondência parcial.
- Pedido rejeitado é atualizado automaticamente no App, com popup e mensagem visível em **Pedidos**.
- Telemetria identifica a aplicação como V8.9.2 e o Service Worker usa novo cache.

## Compatibilidade
Requer John Cloud API 1.13.2 ou superior para rejeição com mensagem, faixa de CEP e raio.
