// data/pattern-drag-order-ux-patch.js
// Lightweight UX enhancement for pattern drag-order cards. Does not modify Google login.
(function(){
  if(window.__patternDragOrderUxLite)return;
  window.__patternDragOrderUxLite=true;
  function addStyle(){
    if(document.getElementById('pattern-order-ux-style'))return;
    const style=document.createElement('style');
    style.id='pattern-order-ux-style';
    style.textContent=`
      #pattern-order-bank,#pattern-order-answer{transition:background .18s,border-color .18s,box-shadow .18s;}
      #pattern-order-answer:empty::before{content:'點上方單字，或把單字拖到這裡';color:#94a3b8;font-weight:900;align-self:center;padding:8px;}
      .pattern-order-token{touch-action:manipulation;user-select:none;min-height:42px;border-radius:999px!important;box-shadow:0 2px 8px rgba(15,23,42,.08);}
      .pattern-order-bank-token{background:#fff!important;border-color:#c7d2fe!important;color:#3730a3!important;}
      .pattern-order-answer-token{background:#dcfce7!important;border-color:#86efac!important;color:#166534!important;}
      @media(max-width:520px){.pattern-order-token{min-height:46px;font-size:1rem!important}}
    `;
    document.head.appendChild(style);
  }
  document.addEventListener('DOMContentLoaded',addStyle);
  addStyle();
})();
