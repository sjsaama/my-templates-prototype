// design-tokens.js — density → CSS custom properties (PR1 foundation)
window.DENSITY_VARS = {
  compact: {
    rowPad: 12,
    pageY: 32,
    pageX: 32,
    tableGap: 6,
    theadMin: 44,
    tplItemY: 14,
    ghostRowY: 12,
    collapseTop: 38,
  },
  regular: {
    rowPad: 20,
    pageY: 46,
    pageX: 40,
    tableGap: 10,
    theadMin: 48,
    tplItemY: 18,
    ghostRowY: 16,
    collapseTop: 52,
  },
  comfy: {
    rowPad: 28,
    pageY: 56,
    pageX: 48,
    tableGap: 14,
    theadMin: 52,
    tplItemY: 22,
    ghostRowY: 20,
    collapseTop: 62,
  },
};

window.densityStyle = function densityStyle(density, accent) {
  const d = window.DENSITY_VARS[density] || window.DENSITY_VARS.regular;
  return {
    "--accent": accent,
    "--row-pad": d.rowPad + "px",
    "--page-pad-y": d.pageY + "px",
    "--page-pad-x": d.pageX + "px",
    "--table-gap": d.tableGap + "px",
    "--thead-min-height": d.theadMin + "px",
    "--tpl-item-pad-y": d.tplItemY + "px",
    "--ghost-row-pad-y": d.ghostRowY + "px",
    "--collapse-top": d.collapseTop + "px",
  };
};
