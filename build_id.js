const svg = d3.select("#hexagonPlot");
const width = +svg.attr("width");
const height = +svg.attr("height");
const hexRadius = 20;
const hexWidth = Math.sqrt(3) * hexRadius;
const hexHeight = 2 * hexRadius;
const cols = Math.ceil(width / hexWidth);
const rows = Math.ceil(height / hexHeight);
const lineWidthInput = d3.select("#lineWidth");
const pointRadiusInput = d3.select("#pointRadius");

let points = [];
let lines = [];
let undoStack = [];

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

// Generate points
for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
        let x = col * hexWidth + (row % 2 ? hexWidth / 2 : 0);
        let y = row * 0.75 * hexHeight;
        if (x > 0 && x < width && y > 0 && y < height) {
            points.push({ x, y, col, row });
        }
        if (row % 2 == 0) {
            if (col % 3 == 1) {
                col += 1;
            }
        } else {
            if (col % 3 == 2) {
                col += 1;
            }
        }
    }
}

// Draw points
points.forEach(point => {
    const { x, y, row, col } = point;
    svg.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 8)
        .attr("fill", "gray")
        .attr("id", `circle-${row}-${col}`)
        .on("contextmenu", function(event) {
            event.preventDefault();
            d3.select("#nodeContextMenu")
                .style("left", `${event.pageX}px`)
                .style("top", `${event.pageY}px`)
                .style("display", "block")
                .node().target = this; // Save the target node
        });
});

// Generate lines based on points
points.forEach(point => {
    const { x, y, row, col } = point;
    const neighbors = [
        points.find(p => p.row === row && p.col === col + 1),
        points.find(p => p.row === row + 1 && p.col === col + (row % 2 === 0 ? 0 : 1)),
        points.find(p => p.row === row + 1 && p.col === col + (row % 2 === 0 ? -1 : 0))
    ];

    neighbors.forEach(neighbor => {
        if (neighbor) {
            lines.push({
                x1: x,
                y1: y,
                x2: neighbor.x,
                y2: neighbor.y,
                connects: `circle-${row}-${col},circle-${neighbor.row}-${neighbor.col}`
            });
        }
    });
});

// Draw lines
lines.forEach(line => {
    const { x1, y1, x2, y2, connects } = line;
    svg.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', 'gray')
        .attr('stroke-width', 3)
        .attr('data-connects', connects)
        .on("contextmenu", function(event) {
            event.preventDefault();

            // Calculate midpoint
            let midX = (x1 + x2) / 2;
            let midY = (y1 + y2) / 2;

            const lineElement = d3.select(this);

            // Show context menu
            contextMenu.style("left", `${event.pageX}px`)
                       .style("top", `${event.pageY}px`)
                       .style("display", "block");

            contextMenu.selectAll(".color-option")
                .on("click", function() {
                    const selectedColor = d3.select(this).attr("data-color");

                    // Save the current state for undo
                    const undoState = {
                        action: 'addColoredNode',
                        line: lineElement,
                        nodes: connects.split(','),
                        color: selectedColor
                    };

                    // Add the state to the undo stack
                    undoStack.push(undoState);

                    // Create the colored point
                    lineElement.style('display', 'none');
                    svg.append("circle")
                        .attr("cx", midX)
                        .attr("cy", midY)
                        .attr("r", 10)
                        .attr("fill", selectedColor)
                        .attr("id", `colored-point-${midX}-${midY}`)
                        .on("contextmenu", function(event) {
                            event.preventDefault();
                            d3.select(this).remove();
                            undoStack.push({
                                action: 'removeColoredNode',
                                line: lineElement,
                                nodes: connects.split(','),
                                color: selectedColor
                            });
                            lineElement.style('display', null);
                        });

                    // Remove the two nodes forming the line and their connected lines
                    undoState.nodes.forEach(connect => {
                        d3.select(`#${connect}`).remove();
                        d3.selectAll(`[data-connects^='${connect},'], [data-connects$=',${connect}']`).remove();
                    });

                    contextMenu.style("display", "none");
                });
        });
});

// Create context menu options for element colors
const contextMenu = d3.select("#contextMenu");
elementColors.forEach(({ element, color }) => {
    contextMenu.append("div")
        .attr("class", "color-option")
        .attr("data-color", color)
        .text(element);
});

// Create context menu option for changing original node color to blue
const nodeContextMenu = d3.select("#nodeContextMenu");
nodeContextMenu.append("div")
    .attr("class", "color-option")
    .attr("data-color", "blue")
    .text("Change to Blue")
    .on("click", function() {
        const selectedColor = d3.select(this).attr("data-color");
        const targetNode = d3.select(nodeContextMenu.node().target);
        targetNode.attr("fill", selectedColor);
        nodeContextMenu.style("display", "none");
    });

// Event listener for line width adjustment
lineWidthInput.on("input", function(event) {
    const newValue = event.target.value;
    svg.selectAll("line").attr("stroke-width", newValue);
});

// Event listener for point radius adjustment
pointRadiusInput.on("input", function(event) {
    const newValue = event.target.value;
    svg.selectAll("circle").attr("r", newValue);
});

// Hide context menus when clicking elsewhere
d3.select(document).on("click", function(event) {
    if (!d3.select(event.target).classed("color-option")) {
        contextMenu.style("display", "none");
        nodeContextMenu.style("display", "none");
    }
});

// Undo function to handle Ctrl+Z
function undo() {
    const lastAction = undoStack.pop();
    if (!lastAction) return;

    if (lastAction.action === 'addColoredNode') {
        // Remove the colored node
        const lineElement = lastAction.line;
        let midX = (lineElement.attr("x1") + lineElement.attr("x2")) / 2;
        let midY = (lineElement.attr("y1") + lineElement.attr("y2")) / 2;
        const id = `colored-point-${midX}-${midY}`;
        d3.select(`#${id.replace(/\./g, '\\.')}`).remove();

        // Restore the original line
        lineElement.style('display', null);

        // Restore the nodes and their connected lines
        lastAction.nodes.forEach(connect => {
            const coords = connect.split('-').slice(1).map(Number);
            const point = points.find(p => p.row === coords[0] && p.col === coords[1]);
            svg.append("circle")
                .attr("cx", point.x)
                .attr("cy", point.y)
                .attr("r", 8)
                .attr("fill", "gray")
                .attr("id", connect);

            d3.selectAll(`[data-connects^='${connect},'], [data-connects$=',${connect}']`).each(function() {
                const lineData = d3.select(this).data()[0];
                svg.append('line')
                    .attr('x1', lineData.x1)
                    .attr('y1', lineData.y1)
                    .attr('x2', lineData.x2)
                    .attr('y2', lineData.y2)
                    .attr('stroke', 'gray')
                    .attr('stroke-width', 3)
                    .attr('data-connects', lineData.connects);
            });
        });
    }
}

// Listen for Ctrl+Z to undo
d3.select(window).on("keydown", function(event) {
    if (event.ctrlKey && event.key === 'z') {
        undo();
    }
});
