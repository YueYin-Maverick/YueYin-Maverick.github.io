const elements = [
{symbol: "Al", position:49  ,color:"#9FDAF7"},  
{symbol: "Sc", position:57  ,color:"#9FDAF7"}, 
{symbol: "Ti", position:58  ,color:"#9FDAF7"}, 
{symbol: "V" , position:59  ,color:"#9FDAF7"}, 
{symbol: "Cr", position:60  ,color:"#9FDAF7"}, 
{symbol: "Mn", position:61  ,color:"#9FDAF7"}, 
{symbol: "Fe", position:62  ,color:"#9FDAF7"}, 
{symbol: "Co", position:63  ,color:"#9FDAF7"}, 
{symbol: "Ni", position:64  ,color:"#9FDAF7"}, 
{symbol: "Cu", position:65  ,color:"#9FDAF7"}, 
{symbol: "Zn", position:66  ,color:"#9FDAF7"}, 
{symbol: "Ga", position:67  ,color:"#9FDAF7"}, 
{symbol: "Ge", position:68  ,color:"#9FDAF7"}, 
{symbol: "Y" , position:75  ,color:"#9FDAF7"}, 
{symbol: "Zr", position:76  ,color:"#9FDAF7"}, 
{symbol: "Nb", position:77  ,color:"#9FDAF7"}, 
{symbol: "Mo", position:78  ,color:"#9FDAF7"}, 
{symbol: "Tc", position:79  ,color:"#9FDAF7"}, 
{symbol: "Ru", position:80  ,color:"#9FDAF7"}, 
{symbol: "Rh", position:81  ,color:"#9FDAF7"}, 
{symbol: "Pd", position:82  ,color:"#9FDAF7"}, 
{symbol: "Ag", position:83  ,color:"#9FDAF7"}, 
{symbol: "Cd", position:84  ,color:"#9FDAF7"}, 
{symbol: "In", position:85  ,color:"#9FDAF7"}, 
{symbol: "Sn", position:86  ,color:"#9FDAF7"}, 
{symbol: "Sb", position:87  ,color:"#9FDAF7"}, 
{symbol: "Hf", position:94  ,color:"#9FDAF7"}, 
{symbol: "Ta", position:95  ,color:"#9FDAF7"}, 
{symbol: "W ", position:96  ,color:"#9FDAF7"}, 
{symbol: "Re", position:97  ,color:"#9FDAF7"}, 
{symbol: "Os", position:98  ,color:"#9FDAF7"}, 
{symbol: "Ir", position:99  ,color:"#9FDAF7"}, 
{symbol: "Pt", position:100 ,color:"#9FDAF7"}, 
{symbol: "Au", position:101 ,color:"#9FDAF7"}, 
{symbol: "Tl", position:103 ,color:"#9FDAF7"}, 
{symbol: "Pb", position:104 ,color:"#9FDAF7"}, 
{symbol: "Bi", position:105 ,color:"#9FDAF7"}, 
{symbol: "Ce", position:148 ,color:"#9FDAF7"}, 
];


const legend = [ 
{symbol: "Metal", position:25 ,color:"#9FDAF7"}, 
{symbol: "Non-Metal", position:26 ,color:"#F9B3AD"}, 
{symbol: "Noble-Gas", position:27 ,color:"#D9DEE7"}, 
]


const positions = [
   [1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
   [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
   [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54],
   [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72],
   [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
   [91, 92, 93, 94, 95, 96, 97, 98, 99,100,101,102,103,104,105,106,107,108],
   [109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126],
   [127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144],
   [145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162],
   [163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180]];


const selected = {
  ele1: null,
  ele2: null,
};

function displayElement(element, index) {
  if (element) {
    document.getElementById(index === 1 ? "ele1" : "ele2").textContent = element.symbol;
  } else {
    document.getElementById(index === 1 ? "ele1" : "ele2").textContent = "---";
  }
}


function scrollToPlot() {
  const img = document.getElementById('png-viewer-img');
  const imgRect = img.getBoundingClientRect();
  const offset = (window.innerHeight - imgRect.height) / 2;
  window.scrollTo({
    top: imgRect.top + window.scrollY - offset,
    behavior: 'smooth'
  });
}


function displayPlot() {
  if (selected.ele1 && selected.ele2) {
    // Sort the symbols alphabetically to ensure a consistent file name (A_B.html)
    const symbols = [selected.ele1.symbol, selected.ele2.symbol].sort();
    const fileName = `./PhaseDiagrams/${symbols[0]}_${symbols[1]}.html`;
    window.location.href = fileName;
  }
}


function toggleElement(element) {
  if (selected.ele1 && selected.ele2) {
    selected.ele1 = element;
    delete selected.ele2;
  } else if (!selected.ele1) {
    selected.ele1 = element;
  } else if (!selected.ele2) {
    selected.ele2 = element;
  }
}


function createTable() {
  const table = document.getElementById("periodic-table");
  for (const positionRow of positions) {
    for (const position of positionRow) {
      const element = elements.find((e) => e.position === position);
      if (element) {
        const cell = document.createElement("div");
        cell.classList.add("element");

        cell.innerHTML = `<span class="element-symbol">${element.symbol}</span>`;

        cell.style.backgroundColor = element.color; // Set the element's background color
        cell.addEventListener("click", () => {
          toggleElement(element);
          cell.classList.toggle("selected");
          displayElement(selected.ele1, 1);
          displayElement(selected.ele2, 2);
          displayPlot();
        });

        element.domElement = cell;
        table.appendChild(cell);
      } else {
        const emptyCell = document.createElement("div");
        emptyCell.style.width = "40px";
        emptyCell.style.height = "40px";
        table.appendChild(emptyCell);
      }
    }
  }
}

createTable();