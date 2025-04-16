// Get the plot ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const plotId = urlParams.get('plot');

const plotConfigurations = {
  hexagonPlot1: "QV1.json",
  hexagonPlot2: "QV2.json",
  hexagonPlot3: "QV3.json",
  hexagonPlot4: "QV4.json",
  hexagonPlot5: "QV5.json",
  hexagonPlot6: "QV6.json"
};

const jsonFile = plotConfigurations[plotId];

// Update the title based on the selected QV
const titleElement = document.querySelector('h1');
if (jsonFile) {
  // Remove the ".json" extension from the file name to display the QV label (e.g., QV2)
  titleElement.textContent = jsonFile.replace('.json', '');
}

// Full element colors list (for metals and others)
const elementColors = [
  { element: "Al", color: "#00FA9A" },
  { element: "Sc", color: "#FFB6C1" },
  { element: "Ti", color: "#B0C4DE" },
  { element: "V", color: "#7FFFD4" },
  { element: "Cr", color: "#FF6347" },
  { element: "Mn", color: "#4682B4" },
  { element: "Fe", color: "#FF4500" },
  { element: "Co", color: "#8A2BE2" },
  { element: "Ni", color: "#2E8B57" },
  { element: "Cu", color: "#D2691E" },
  { element: "Zn", color: "#6495ED" },
  { element: "Ga", color: "#F08080" },
  { element: "Ge", color: "#E0FFFF" },
  { element: "Y", color: "#32CD32" },
  { element: "Zr", color: "#40E0D0" },
  { element: "Nb", color: "#9ACD32" },
  { element: "Mo", color: "#FF7F50" },
  { element: "Tc", color: "#9932CC" },
  { element: "Ru", color: "#DAA520" },
  { element: "Rh", color: "#DC143C" },
  { element: "Pd", color: "#FFD700" },
  { element: "Ag", color: "#C0C0C0" },
  { element: "Cd", color: "#B8860B" },
  { element: "In", color: "#FA8072" },
  { element: "Sn", color: "#E9967A" },
  { element: "Sb", color: "#ADD8E6" },
  { element: "Ce", color: "#8FBC8F" },
  { element: "Hf", color: "#BA55D3" },
  { element: "Ta", color: "#87CEFA" },
  { element: "W", color: "#7FFF00" },
  { element: "Re", color: "#FFDAB9" },
  { element: "Os", color: "#FFC0CB" },
  { element: "Ir", color: "#CD5C5C" },
  { element: "Pt", color: "#4B0082" },
  { element: "Au", color: "#FFD700" },
  { element: "Tl", color: "#FFFACD" },
  { element: "Pb", color: "#90EE90" },
  { element: "Bi", color: "#DDA0DD" }
];

const defaultLineWidth = 10;
const defaultNodeRadius = 24;

const svg = d3.select("#selectedPlot");
const width = svg.node().clientWidth;
const height = svg.node().clientHeight;

// Create a floating metal context menu for metal atoms.
const metalMenu = d3.select("body")
  .append("div")
  .attr("id", "metalMenu")
  .style("position", "absolute")
  .style("background", "#f7f7f7")
  .style("border", "1px solid #ccc")
  .style("padding", "5px")
  .style("z-index", 1001)
  .style("grid-template-columns", "repeat(6, auto)")
  .style("column-gap", "5px")
  .style("row-gap", "5px")
  .style("display", "none");

elementColors.forEach(item => {
  metalMenu.append("div")
    .attr("class", "menu-item")
    .style("padding", "3px 6px")
    .style("cursor", "pointer")
    .text(item.element)
    .on("click", function(event) {
      const selectedElement = d3.select(this).text();
      const selectedColor = elementColors.find(d => d.element === selectedElement).color;
      if (metalMenu.node().targetNode) {
        const metalNode = d3.select(metalMenu.node().targetNode);
        metalNode
          .attr("fill", selectedColor)
          .attr("data-element", selectedElement);
        const d = metalNode.datum();
        d.fixedColor = selectedColor;
        d.element = selectedElement;
        const metalId = d.id;
        svg.selectAll(".line-segment2")
          .filter(lineData => lineData.targetId === metalId)
          .attr("stroke", selectedColor);
        svg.selectAll(".line-segment1")
          .filter(lineData => lineData.sourceId === metalId)
          .attr("stroke", selectedColor);
      }
      metalMenu.style("display", "none");
    });
});

let metalCounter = 0;
d3.json(jsonFile).then(data => {
  let nCounter = 1;
  data.forEach(d => {
    if (d.class === 'N') {
      d.order = nCounter++;
    }
  });
  
  data.forEach(d => {
    if (d.class === 'M') {
      if (metalCounter === 0) {
        d.element = "Ag";
        d.fixedColor = elementColors.find(e => e.element === "Ag").color;
      } else if (metalCounter === 1) {
        d.element = "Au";
        d.fixedColor = elementColors.find(e => e.element === "Au").color;
      }
      metalCounter++;
    }
  });

  const nodes = data.map((d, index) => ({
    id: index,
    x: d3.scaleLinear().domain([0, d3.max(data, d => d.x)]).range([0, width])(d.x),
    y: d3.scaleLinear().domain([0, d3.max(data, d => d.y)]).range([0, height])(d.y),
    className: d.class, // track current state for toggling
    order: d.order,
    element: d.class === 'M' ? d.element : undefined,
    fixedColor: d.class === 'M' ? d.fixedColor : undefined
  }));
  
  const lines = [];
  const cutoffDistanceClass0 = 120;
  const cutoffDistanceClass0Class1 = 160;
  
  nodes.forEach((node, i) => {
    if (node.className === 'C' || node.className === 'N') {
      nodes.forEach((otherNode, j) => {
        if (i !== j && (otherNode.className === 'C' || otherNode.className === 'N')) {
          const distance = Math.hypot(node.x - otherNode.x, node.y - otherNode.y);
          if (distance <= cutoffDistanceClass0) {
            lines.push({
              sourceId: node.id,
              targetId: otherNode.id,
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
  
  nodes.forEach((node, i) => {
    if (node.className === 'C' || node.className === 'N') {
      nodes.forEach((otherNode, j) => {
        if (i !== j && otherNode.className === 'M') {
          const distance = Math.hypot(node.x - otherNode.x, node.y - otherNode.y);
          if (distance <= cutoffDistanceClass0Class1) {
            lines.push({
              sourceId: node.id,
              targetId: otherNode.id,
              x1: node.x,
              y1: node.y,
              x2: otherNode.x,
              y2: otherNode.y,
              color1: node.className === 'N' ? "blue" : "gray",
              color2: otherNode.fixedColor
            });
          }
        }
      });
    }
  });
  
  svg.selectAll("circle")
    .data(nodes)
    .enter().append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", defaultNodeRadius)
    .attr("fill", d => {
      if(d.className === 'C') return "gray";
      if(d.className === 'M') return d.fixedColor;
      return "blue";
    })
    .attr("class", d => d.className)
    .attr("data-nodeid", d => d.id)
    .on("contextmenu", function(event, d) {
      event.preventDefault();
      if (d.className === 'M') {
        event.stopPropagation();
        metalMenu.node().targetNode = this;
        metalMenu.style("left", `${event.pageX}px`)
                 .style("top", `${event.pageY}px`)
                 .style("display", "grid");
      }
      else if (d.className === 'N' || d.className === 'C') {
        const newClass = d.className === 'N' ? 'C' : 'N';
        const newFill = newClass === 'N' ? "blue" : "gray";
        d3.select(this)
          .attr("fill", newFill)
          .attr("class", newClass);
        d.className = newClass;
        const changedNodeId = d.id;
        svg.selectAll(".line-segment1")
          .filter(lineData => lineData.sourceId === changedNodeId)
          .attr("stroke", newFill);
        svg.selectAll(".line-segment2")
          .filter(lineData => lineData.targetId === changedNodeId)
          .attr("stroke", newFill);
      }
    });
  
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
  
  svg.selectAll("line").style("pointer-events", "none");

  // On clicking the Show Order button, filter nodes based on the current state.
  d3.select("#showOrderButton").on("click", function() {
    const nitrogenIndices = nodes.filter(d => d.className === 'N').map(d => d.order);
    d3.select("#orderOutput")
      .html("Nitrogen (N) Atom Orders: " + nitrogenIndices.join(", "));
  });
  
}).catch(error => console.error(`Error loading ${jsonFile}:`, error));

d3.select("#lineWidth").on("input", function() {
  const newWidth = +this.value;
  svg.selectAll("line").attr("stroke-width", newWidth);
});
d3.select("#atomRadius").on("input", function() {
  const newRadius = +this.value;
  svg.selectAll("circle").attr("r", newRadius);
});

d3.select(document).on("click", function(event) {
  if (!d3.select(event.target).classed("menu-item")) {
    metalMenu.style("display", "none");
  }
});
