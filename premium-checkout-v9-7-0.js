(()=>{'use strict';
// Hotfix V9.7.1: o observador visual V9.7.0 foi desativado porque podia
// reagir às próprias mutações do checkout e travar a finalização no celular.
// Mantemos o arquivo para compatibilidade com instalações/cache antigos,
// mas sem interceptar ou observar o fluxo de pedido.
window.__CASEIRINHO_PREMIUM_CHECKOUT_970__=true;
window.CaseirinhoPremiumCheckout970={
  version:'9.7.1-safe',
  disabled:true,
  sync:()=>{}
};
})();
