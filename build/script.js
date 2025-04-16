const plotConfigurations = [
  { id: "hexagonPlot1", json: "QV1.json" },  // Provide your own QV1.json or duplicate a sample file.
  { id: "hexagonPlot2", json: "QV2.json" },  // Provide your own QV2.json or duplicate a sample file.
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

const defaultLineWidth = 5;
const defaultNodeRadius = 12;

// Create the plots for each configuration
plotConfigurations.forEach(config => {
  const svg = d3.select(`#${config.id}`);
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  d3.json(config.json).then(data => {
    // Scale points to fit within the SVG canvas
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.x)])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.y)])
      .range([0, height]);

    const nodes = data.map(d => ({
      x: xScale(d.x),
      y: yScale(d.y),
      className: d.class
    }));

    // Create the circles (nodes)
    svg.selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", defaultNodeRadius)
      .attr("fill", d => d.className === 'C' ? "gray" : d.className === 'M' ? getRandomElementColor() : "blue")
      .attr("class", d => d.className);

    const lines = [];

    const cutoffDistanceClass0 = 60;      // cutoff for linking class C and N nodes
    const cutoffDistanceClass0Class1 = 80;  // cutoff for linking C/N to M nodes

    // Create links for nodes of class C and N
    nodes.forEach((node, i) => {
      if (node.className === 'C' || node.className === 'N') {
        nodes.forEach((otherNode, j) => {
          if (i !== j && (otherNode.className === 'C' || otherNode.className === 'N')) {
            const distance = Math.hypot(node.x - otherNode.x, node.y - otherNode.y);
            if (distance <= cutoffDistanceClass0) {
              lines.push({
                x1: node.x,
                y1: node.y,
                x2: otherNode.x,
                y2: otherNode.y,
                color1: node.className === 'N' ? "blue" : "gray",
                color2: otherNode.className === 'N' ? "blue" : "gray"
              });
            }
          }
        });
      }
    });

    // Create links between C/N and M nodes
    nodes.forEach((node, i) => {
      if (node.className === 'C' || node.className === 'N') {
        nodes.forEach((otherNode, j) => {
          if (i !== j && otherNode.className === 'M') {
            const distance = Math.hypot(node.x - otherNode.x, node.y - otherNode.y);
            if (distance <= cutoffDistanceClass0Class1) {
              lines.push({
                x1: node.x,
                y1: node.y,
                x2: otherNode.x,
                y2: otherNode.y,
                color1: node.className === 'N' ? "blue" : "gray",
                color2: getRandomElementColor()
              });
            }
          }
        });
      }
    });

    // Draw lines in two halves (to allow different colors on each segment)
    svg.selectAll(".line-segment1")
      .data(lines)
      .enter().append("line")
      .attr("x1", d => d.x1)
      .attr("y1", d => d.y1)
      .attr("x2", d => (d.x1 + d.x2) / 2)
      .attr("y2", d => (d.y1 + d.y2) / 2)
      .attr("stroke", d => d.color1)
      .attr("stroke-width", defaultLineWidth)
      .attr("class", "line-segment1");

    svg.selectAll(".line-segment2")
      .data(lines)
      .enter().append("line")
      .attr("x1", d => (d.x1 + d.x2) / 2)
      .attr("y1", d => (d.y1 + d.y2) / 2)
      .attr("x2", d => d.x2)
      .attr("y2", d => d.y2)
      .attr("stroke", d => d.color2)
      .attr("stroke-width", defaultLineWidth)
      .attr("class", "line-segment2");

    // Update M nodes’ color periodically
    setInterval(() => {
      svg.selectAll("circle")
        .filter(d => d.className === 'M')
        .each(function(d) {
          const newColor = getRandomElementColor();
          d3.select(this).attr("fill", newColor);
          svg.selectAll(".line-segment2")
            .filter(line => line.x2 === d.x && line.y2 === d.y)
            .attr("stroke", newColor);
        });
    }, 500);

  }).catch(error => console.error(`Error loading ${config.json}:`, error));
});



function getRandomElementColor() {
  const randomIndex = Math.floor(Math.random() * elementColors.length);
  return elementColors[randomIndex].color;
}

// Adjust line width based on the slider input
d3.select("#lineWidth").on("input", function() {
  const newWidth = +this.value;
  plotConfigurations.forEach(config => {
    const svg = d3.select(`#${config.id}`);
    svg.selectAll("line").attr("stroke-width", newWidth);
  });
});

// Adjust node radius based on the slider input
d3.select("#atomRadius").on("input", function() {
  const newRadius = +this.value;
  plotConfigurations.forEach(config => {
    const svg = d3.select(`#${config.id}`);
    svg.selectAll("circle").attr("r", newRadius);
  });
});

// Make each plot clickable to open the single view
d3.selectAll("svg.plot").on("click", function() {
  const plotId = d3.select(this).attr("id");
  window.location.href = `single_QV.html?plot=${plotId}`;
});
