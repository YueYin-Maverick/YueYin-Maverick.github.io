const plotConfigurations = [
  { id: "hexagonPlot1", json: "QV1.json" },
  { id: "hexagonPlot2", json: "QV2.json" },
  { id: "hexagonPlot3", json: "QV3.json" },
  { id: "hexagonPlot4", json: "QV4.json" },
  { id: "hexagonPlot5", json: "QV5.json" },
  { id: "hexagonPlot6", json: "QV6.json" }
];

const elementColors = [
 { element: "Al", color: "#81B3D6", radius: 126 },
  { element: "Sc", color: "#B663AC", radius: 148 },
  { element: "Ti", color: "#78CAFF", radius: 136 },
  { element: "V",  color: "#E61A00", radius: 134 },
  { element: "Cr", color: "#00009E", radius: 122 },
  { element: "Mn", color: "#A9099E", radius: 119 },
  { element: "Fe", color: "#B57200", radius: 116 },
  { element: "Co", color: "#0000AF", radius: 111 },
  { element: "Ni", color: "#B8BCBE", radius: 110 },
  { element: "Cu", color: "#2247DD", radius: 112 },
  { element: "Zn", color: "#8F9082", radius: 118 },
  { element: "Ga", color: "#9FE474", radius: 124 },
  { element: "Ge", color: "#7E6FA6", radius: 121 },
  { element: "Y",  color: "#67988E", radius: 163 },
  { element: "Zr", color: "#00FF00", radius: 154 },
  { element: "Nb", color: "#4CB376", radius: 147 },
  { element: "Mo", color: "#B486B0", radius: 138 },
  { element: "Tc", color: "#CDAFCB", radius: 128 },
  { element: "Ru", color: "#CFB8AE", radius: 125 },
  { element: "Rh", color: "#CED2AB", radius: 125 },
  { element: "Pd", color: "#C2C4B9", radius: 120 },
  { element: "Ag", color: "#B8BCBE", radius: 128 },
  { element: "Cd", color: "#F31FDC", radius: 136 },
  { element: "In", color: "#D781BB", radius: 142 },
  { element: "Sn", color: "#9B8FBA", radius: 140 },
  { element: "Sb", color: "#D88350", radius: 140 },
  { element: "Ce", color: "#D1FD06", radius: 163 },
  { element: "Hf", color: "#B4B459", radius: 152 },
  { element: "Ta", color: "#B79B56", radius: 146 },
  { element: "W",  color: "#8E8A80", radius: 137 },
  { element: "Re", color: "#B3B18E", radius: 131 },
  { element: "Os", color: "#C9B179", radius: 129 },
  { element: "Ir", color: "#C9CF73", radius: 122 },
  { element: "Pt", color: "#CCC6BF", radius: 123 },
  { element: "Au", color: "#FEB338", radius: 124 },
  { element: "Tl", color: "#96896D", radius: 144 },
  { element: "Pb", color: "#53535B", radius: 144 },
  { element: "Bi", color: "#D230F8", radius: 151 }
];

const recolorJobs = [];

// ——▶ Change these two to control your plot’s look:
const defaultLineWidth  = 5;   // bond thickness
const defaultNodeRadius = 10;  // atom radius

// ——▶ And these for data‑space cutoffs (your JSON’s x/y units):
const dataCutoffCN  = 2;  // C–C / C–N
const dataCutoffCNM = 2;  // C/N – M

// build each plot…
plotConfigurations.forEach(config => {
  const svg    = d3.select(`#${config.id}`);
  const width  = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  d3.json(config.json).then(data => {
    // 1) build scales
    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d=>d.x), d3.max(data, d=>d.x)])
      .range([0, width]);
    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d=>d.y), d3.max(data, d=>d.y)])
      .range([0, height]);

    // 2) map raw + screen coords
    const nodes = data.map(d => ({
      rawX: d.x, rawY: d.y,
      x:    xScale(d.x),
      y:    yScale(d.y),
      className: d.class
    }));

    // 3) build bonds
    const lines = [];
    nodes.forEach((n,i) => {
      if (n.className==='C' || n.className==='N') {
        nodes.forEach((m,j) => {
          if (i===j) return;
          const dRaw = Math.hypot(n.rawX - m.rawX, n.rawY - m.rawY);
          if ((m.className==='C'||m.className==='N') && dRaw<=dataCutoffCN) {
            lines.push({
              x1:n.x,y1:n.y,x2:m.x,y2:m.y,
              color1: n.className==='N'?'blue':'gray',
              color2: m.className==='N'?'blue':'gray'
            });
          } else if (m.className==='M' && dRaw<=dataCutoffCNM) {
            lines.push({
              x1:n.x,y1:n.y,x2:m.x,y2:m.y,
              color1: n.className==='N'?'blue':'gray',
              color2: getRandomElementEntry().color
            });
          }
        });
      }
    });

    // 4) draw half‐bonds
    svg.selectAll(".bond1")
      .data(lines)
      .enter().append("line")
      .attr("class","bond1")
      .attr("x1",d=>d.x1).attr("y1",d=>d.y1)
      .attr("x2",d=> (d.x1+d.x2)/2 ).attr("y2",d=> (d.y1+d.y2)/2 )
      .attr("stroke", d=>d.color1)
      .attr("stroke-width", defaultLineWidth);

    svg.selectAll(".bond2")
      .data(lines)
      .enter().append("line")
      .attr("class","bond2")
      .attr("x1",d=> (d.x1+d.x2)/2 ).attr("y1",d=> (d.y1+d.y2)/2 )
      .attr("x2",d=>d.x2).attr("y2",d=>d.y2)
      .attr("stroke", d=>d.color2)
      .attr("stroke-width", defaultLineWidth);

    // 5) draw atoms on top, picking color+radius for M’s
    const circles = svg.selectAll("circle")
      .data(nodes)
      .enter().append("circle");

    circles.each(function(d) {
      const sel = d3.select(this)
        .attr("cx", d.x)
        .attr("cy", d.y)
        .attr("class", d.className);

      if (d.className === 'M') {
        // pick a random metal entry
        const entry = getRandomElementEntry();
        sel.attr("fill", entry.color)
           .attr("r",     entry.radius * 0.15);
      } else if (d.className === 'C') {
        sel.attr("fill","gray")
           .attr("r",   defaultNodeRadius);
      } else {  // N or anything else
        sel.attr("fill","blue")
           .attr("r",   defaultNodeRadius);
      }
    });

    // register for later recolor
    recolorJobs.push({ svg, nodes });
  })
  .catch(err => console.error(`Error loading ${config.json}:`, err));
});

// clicking any plot drills in
d3.selectAll("svg.plot").on("click", function() {
  window.location.href = `single_QV_3D.html?plot=${this.id}`;
});

// 6) one global timer: recolor ONE plot at a time every 500ms
let currentPlot = 0;
setInterval(() => {
  if (recolorJobs.length === 0) return;
  const { svg } = recolorJobs[currentPlot];

  svg.selectAll("circle")
    .filter(d => d.className === 'M')
    .each(function(d) {
      const sel = d3.select(this);
      const entry = getRandomElementEntry();
      sel.attr("fill", entry.color)
         .attr("r",     entry.radius * 0.15);

      // update matching half‐bonds
      svg.selectAll(".bond2")
        .filter(b => b.x2===d.x && b.y2===d.y)
        .attr("stroke", entry.color);
    });

  currentPlot = (currentPlot + 1) % recolorJobs.length;
}, 500);

// helper: pick a random metal from your palette (with color+radius)
function getRandomElementEntry() {
  return elementColors[
    Math.floor(Math.random() * elementColors.length)
  ];
}