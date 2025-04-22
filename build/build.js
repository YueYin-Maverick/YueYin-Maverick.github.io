const plotConfigurations = [
  { id: "hexagonPlot1", json: "QV1.json" },
  { id: "hexagonPlot2", json: "QV2.json" },
  { id: "hexagonPlot3", json: "QV3.json" },
  { id: "hexagonPlot4", json: "QV4.json" },
  { id: "hexagonPlot5", json: "QV5.json" },
  { id: "hexagonPlot6", json: "QV6.json" }
];

const elementColors = [
  { element: "Sc", color: "#FFB6C1" }, { element: "Ti", color: "#B0C4DE" }, { element: "V", color: "#7FFFD4" },
  { element: "Cr", color: "#FF6347" }, { element: "Mn", color: "#4682B4" }, { element: "Fe", color: "#FF4500" },
  { element: "Co", color: "#8A2BE2" }, { element: "Ni", color: "#2E8B57" }, { element: "Cu", color: "#D2691E" },
  { element: "Zn", color: "#6495ED" }, { element: "Y", color: "#32CD32" }, { element: "Zr", color: "#40E0D0" },
  { element: "Nb", color: "#9ACD32" }, { element: "Mo", color: "#FF7F50" }, { element: "Tc", color: "#9932CC" },
  { element: "Ru", color: "#DAA520" }, { element: "Rh", color: "#DC143C" }, { element: "Pd", color: "#FFD700" },
  { element: "Ag", color: "#C0C0C0" }, { element: "Cd", color: "#B8860B" }, { element: "Ce", color: "#8FBC8F" },
  { element: "Hf", color: "#BA55D3" }, { element: "Ta", color: "#87CEFA" }, { element: "W", color: "#7FFF00" },
  { element: "Re", color: "#FFDAB9" }, { element: "Os", color: "#FFC0CB" }, { element: "Ir", color: "#CD5C5C" },
  { element: "Pt", color: "#4B0082" }, { element: "Au", color: "#FFD700" }, { element: "Al", color: "#00FA9A" },
  { element: "Ga", color: "#F08080" }, { element: "Ge", color: "#E0FFFF" }, { element: "In", color: "#FA8072" },
  { element: "Sn", color: "#E9967A" }, { element: "Sb", color: "#ADD8E6" }, { element: "Tl", color: "#FFFACD" },
  { element: "Pb", color: "#90EE90" }, { element: "Bi", color: "#DDA0DD" }
];

// ——▶ Change these two to control your plot’s look:
const defaultLineWidth  = 5;   // bond thickness
const defaultNodeRadius = 12;  // atom radius

// ——▶ And these for data‑space cutoffs (your JSON’s x/y units):
const dataCutoffCN  = 2;  // C–C / C–N
const dataCutoffCNM = 2;  // C/N – M

plotConfigurations.forEach(config => {
  const svg    = d3.select(`#${config.id}`);
  const width  = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  d3.json(config.json).then(data => {
    // build scales
    const xScale = d3.scaleLinear()
      .domain([ d3.min(data, d => d.x), d3.max(data, d => d.x) ])
      .range([0, width]);
    const yScale = d3.scaleLinear()
      .domain([ d3.min(data, d => d.y), d3.max(data, d => d.y) ])
      .range([0, height]);

    // keep both raw and screen coords
    const nodes = data.map(d => ({
      rawX:      d.x,
      rawY:      d.y,
      x:         xScale(d.x),
      y:         yScale(d.y),
      className: d.class
    }));

    // draw circles
    svg.selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("cx",    d => d.x)
      .attr("cy",    d => d.y)
      .attr("r",     defaultNodeRadius)
      .attr("fill",  d => 
        d.className === 'C' ? "gray" :
        d.className === 'M' ? getRandomElementColor() :
        "blue"
      )
      .attr("class", d => d.className);

    // build bonds by raw distance
    const lines = [];
    nodes.forEach((n,i) => {
      if (n.className === 'C' || n.className === 'N') {
        nodes.forEach((m,j) => {
          if (i === j) return;
          const dRaw = Math.hypot(n.rawX - m.rawX, n.rawY - m.rawY);

          if ((m.className === 'C' || m.className === 'N') && dRaw <= dataCutoffCN) {
            lines.push({
              x1: n.x, y1: n.y, x2: m.x, y2: m.y,
              color1: n.className==='N'?"blue":"gray",
              color2: m.className==='N'?"blue":"gray"
            });
          }
          else if (m.className==='M' && dRaw <= dataCutoffCNM) {
            lines.push({
              x1: n.x, y1: n.y, x2: m.x, y2: m.y,
              color1: n.className==='N'?"blue":"gray",
              color2: getRandomElementColor()
            });
          }
        });
      }
    });

    // render bonds in two halves
    svg.selectAll(".bond1")
      .data(lines)
      .enter().append("line")
      .attr("class", "bond1")
      .attr("x1", d => d.x1).attr("y1", d => d.y1)
      .attr("x2", d => (d.x1+d.x2)/2).attr("y2", d => (d.y1+d.y2)/2)
      .attr("stroke", d => d.color1)
      .attr("stroke-width", defaultLineWidth);

    svg.selectAll(".bond2")
      .data(lines)
      .enter().append("line")
      .attr("class", "bond2")
      .attr("x1", d => (d.x1+d.x2)/2).attr("y1", d => (d.y1+d.y2)/2)
      .attr("x2", d => d.x2).attr("y2", d => d.y2)
      .attr("stroke", d => d.color2)
      .attr("stroke-width", defaultLineWidth);

    // recolor M’s periodically
    setInterval(() => {
      svg.selectAll("circle")
        .filter(d => d.className==='M')
        .each(function(d) {
          const c = getRandomElementColor();
          d3.select(this).attr("fill", c);
          svg.selectAll(".bond2")
            .filter(b => b.x2===d.x && b.y2===d.y)
            .attr("stroke", c);
        });
    }, 500);

  }).catch(err => console.error(`Error loading ${config.json}:`, err));
});

// click to single view
d3.selectAll("svg.plot").on("click", function() {
  window.location.href = `single_QV_3D.html?plot=${this.id}`;
});

// helper
function getRandomElementColor() {
  return elementColors[
    Math.floor(Math.random() * elementColors.length)
  ].color;
}
