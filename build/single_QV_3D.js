// single_QV_3d.js

// ====================
// Tweak these four values:
const defaultLineWidth  = 30;   // cylinder radius multiplier
const defaultAtomRadius = 60;   // in px (sphere diameter)
const defaultCnCutoff   = 80;   // C–C / C–N cutoff
const defaultCmCutoff   = 80;   // C–M / M–C cutoff
// ====================

(async function() {
  // —— DOM refs ——  
  const titleEl      = document.getElementById('title');
  const container    = document.getElementById('container');
  const showOrderBtn = document.getElementById('showOrderButton');
  const downloadBtn  = document.getElementById('downloadVasp');
  const orderOutput  = document.getElementById('orderOutput');
  const menu         = document.getElementById('metalMenu');

  // —— Pick JSON file based on ?plot=hexagonPlotX ——  
  const params = new URLSearchParams(window.location.search);
  const plotId = params.get('plot') || 'hexagonPlot1';
  const jsonFile = {
    hexagonPlot1:'QV1.json', hexagonPlot2:'QV2.json',
    hexagonPlot3:'QV3.json', hexagonPlot4:'QV4.json',
    hexagonPlot5:'QV5.json', hexagonPlot6:'QV6.json'
  }[plotId];
  titleEl.innerText = jsonFile.replace('.json','');

  // —— Color + radius map setup ——  
  const elementColorsList = [
    { element: "Al", color: "#00FA9A", radius: 126 },
    { element: "Sc", color: "#FFB6C1", radius: 148 },
    { element: "Ti", color: "#B0C4DE", radius: 136 },
    { element: "V",  color: "#7FFFD4", radius: 134 },
    { element: "Cr", color: "#FF6347", radius: 122 },
    { element: "Mn", color: "#4682B4", radius: 119 },
    { element: "Fe", color: "#FF4500", radius: 116 },
    { element: "Co", color: "#8A2BE2", radius: 111 },
    { element: "Ni", color: "#2E8B57", radius: 110 },
    { element: "Cu", color: "#D2691E", radius: 112 },
    { element: "Zn", color: "#6495ED", radius: 118 },
    { element: "Ga", color: "#F08080", radius: 124 },
    { element: "Ge", color: "#E0FFFF", radius: 121 },
    { element: "Y",  color: "#32CD32", radius: 163 },
    { element: "Zr", color: "#40E0D0", radius: 154 },
    { element: "Nb", color: "#9ACD32", radius: 147 },
    { element: "Mo", color: "#FF7F50", radius: 138 },
    { element: "Tc", color: "#9932CC", radius: 128 },
    { element: "Ru", color: "#DAA520", radius: 125 },
    { element: "Rh", color: "#DC143C", radius: 125 },
    { element: "Pd", color: "#FFD700", radius: 120 },
    { element: "Ag", color: "#C0C0C0", radius: 128 },
    { element: "Cd", color: "#B8860B", radius: 136 },
    { element: "In", color: "#FA8072", radius: 142 },
    { element: "Sn", color: "#E9967A", radius: 140 },
    { element: "Sb", color: "#ADD8E6", radius: 140 },
    { element: "Ce", color: "#8FBC8F", radius: 163 },
    { element: "Hf", color: "#BA55D3", radius: 152 },
    { element: "Ta", color: "#87CEFA", radius: 146 },
    { element: "W",  color: "#7FFF00", radius: 137 },
    { element: "Re", color: "#FFDAB9", radius: 131 },
    { element: "Os", color: "#FFC0CB", radius: 129 },
    { element: "Ir", color: "#CD5C5C", radius: 122 },
    { element: "Pt", color: "#4B0082", radius: 123 },
    { element: "Au", color: "#FFD700", radius: 124 },
    { element: "Tl", color: "#FFFACD", radius: 144 },
    { element: "Pb", color: "#90EE90", radius: 144 },
    { element: "Bi", color: "#DDA0DD", radius: 151 }
  ];

  const elementColorMap  = {};
  const elementRadiusMap = {};
  elementColorsList.forEach(({element,color,radius})=>{
    elementColorMap[element]  = new THREE.Color(color);
    elementRadiusMap[element] = radius;
  });
  elementColorMap["C"] = new THREE.Color("#888888");
  elementColorMap["N"] = new THREE.Color("#0000FF");
  elementRadiusMap["C"] = elementRadiusMap["C"]||70;
  elementRadiusMap["N"] = elementRadiusMap["N"]||70;
  const maxRadius = Math.max(...elementColorsList.map(e=>e.radius));

  // —— Three.js boilerplate ——  
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(45, container.clientWidth/container.clientHeight, 1, 10000);
  camera.position.set(0,0,600);
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  renderer.domElement.addEventListener('contextmenu', e=>e.preventDefault());
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  scene.add(new THREE.AmbientLight(0x888888));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(1,1,1);
  scene.add(dirLight);

  // —— Load JSON data & build atoms ——  
  const data = await fetch(jsonFile).then(r=>r.json());
  // preset metals for the first two M sites
  const metalSites = data.filter(d=>d.class==='M');
  if (metalSites.length>=2) {
    metalSites[0].element = 'Ag';
    metalSites[1].element = 'Au';
  }
  let nCount = 1;
  data.forEach(d=>{ if(d.class==='N') d.order = nCount++; });

  // scale positions into a -200..+200 box
  const xs = data.map(d=>d.x), ys = data.map(d=>d.y);
  const [Xmin,Xmax] = [Math.min(...xs), Math.max(...xs)];
  const [Ymin,Ymax] = [Math.min(...ys), Math.max(...ys)];
  const scale = (v,mn,mx)=>((v-mn)/(mx-mn)-0.5)*400;
  data.forEach(d=>{
    d._pos = new THREE.Vector3(
      scale(d.x, Xmin, Xmax),
      scale(d.y, Ymin, Ymax),
      0
    );
  });

  // create atom meshes
  const atomGroup = new THREE.Group();
  data.forEach(d=>{
    const col = elementColorMap[d.element]||elementColorMap[d.class]||new THREE.Color(0x888888);
    const mat = new THREE.MeshLambertMaterial({color:col});
    const pm  = elementRadiusMap[d.element]||70;
    const px  = (pm/maxRadius)*(defaultAtomRadius/2);
    const geo = new THREE.SphereGeometry(px,16,16);
    const mesh = new THREE.Mesh(geo,mat);
    mesh.position.copy(d._pos);
    mesh.userData = {data:d};
    atomGroup.add(mesh);
  });
  scene.add(atomGroup);

  // bi-color bond helper
  function makeBiColorBond(a,b,ca,cb,r) {
    const dir = new THREE.Vector3().subVectors(b,a);
    const len = dir.length(), half = len/2;
    const norm = dir.clone().normalize();
    // first half
    const geo1 = new THREE.CylinderGeometry(r,r,half,8,1);
    const mA   = new THREE.MeshLambertMaterial({color:ca});
    const m1   = new THREE.Mesh(geo1,mA);
    m1.position.copy(a.clone().add(norm.clone().multiplyScalar(half/2)));
    m1.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), norm);
    // second half
    const geo2 = new THREE.CylinderGeometry(r,r,half,8,1);
    const mB   = new THREE.MeshLambertMaterial({color:cb});
    const m2   = new THREE.Mesh(geo2,mB);
    m2.position.copy(a.clone().add(norm.clone().multiplyScalar(half+half/2)));
    m2.quaternion.copy(m1.quaternion);
    const grp = new THREE.Group();
    grp.add(m1,m2);
    return grp;
  }

  // rebuild bonds
  const bondGroup = new THREE.Group();
  scene.add(bondGroup);
  function rebuildBonds(cn,cm) {
    bondGroup.clear();
    data.forEach((a,i)=>{
      data.slice(i+1).forEach(b=>{
        const dist = a._pos.distanceTo(b._pos);
        const bothNon = a.class!=='M' && b.class!=='M';
        const oneM    = (a.class==='M') !== (b.class==='M');
        if ((bothNon&&dist<=cn)||(oneM&&dist<=cm)) {
          const ca = elementColorMap[a.element]||elementColorMap[a.class];
          const cb = elementColorMap[b.element]||elementColorMap[b.class];
          bondGroup.add(makeBiColorBond(a._pos,b._pos,ca,cb,defaultLineWidth/10));
        }
      });
    });
  }
  rebuildBonds(defaultCnCutoff,defaultCmCutoff);

  // raycaster for picking
  const ray     = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function getIntersect(ev) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX-rect.left)/rect.width)*2 - 1;
    pointer.y = -((ev.clientY-rect.top)/rect.height)*2 + 1;
    ray.setFromCamera(pointer,camera);
    const hits = ray.intersectObjects(atomGroup.children);
    return hits.length?hits[0].object:null;
  }

  // right-click to toggle N/C or open metal menu
  renderer.domElement.addEventListener('contextmenu',ev=>{
    ev.preventDefault();
    const mesh = getIntersect(ev);
    if(!mesh) return;
    const d = mesh.userData.data;
    if(d.class==='M') {
      openMetalMenu(ev.clientX,ev.clientY,mesh);
    } else {
      d.class = d.class==='N'?'C':'N';
      mesh.material.color.copy(elementColorMap[d.class]);
      rebuildBonds(defaultCnCutoff,defaultCmCutoff);
    }
  });

  // metal picker menu
  function openMetalMenu(x,y,mesh) {
    menu.innerHTML = '';
    menu.style.left = `${x}px`;
    menu.style.top  = `${y}px`;
    Object.keys(elementColorMap).filter(el=>el!=='C'&&el!=='N')
      .forEach(opt=>{
        const btn = document.createElement('div');
        btn.textContent = opt;
        btn.addEventListener('click',()=>{
          mesh.userData.data.element = opt;
          mesh.material.color.copy(elementColorMap[opt]);
          const pmNew = elementRadiusMap[opt]||70;
          const pxNew = (pmNew/maxRadius)*(defaultAtomRadius/2);
          mesh.geometry.dispose();
          mesh.geometry = new THREE.SphereGeometry(pxNew,16,16);
          menu.classList.remove('visible');
          rebuildBonds(defaultCnCutoff,defaultCmCutoff);
        });
        menu.appendChild(btn);
      });
    menu.classList.add('visible');
  }
  window.addEventListener('click',e=>{
    if(!menu.contains(e.target)) menu.classList.remove('visible');
  });

  // —— Return DAC ID ——  
  showOrderBtn.addEventListener('click',()=>{
    const qv = titleEl.innerText;
    const mets = data.filter(d=>d.class==='M').slice(0,2).map(d=>d.element);
    const ords = data.filter(d=>d.class==='N').map(d=>d.order-1);
    orderOutput.innerText = `${qv}_${mets.join('_')}_${ords.join('')}`;
  });

  // —— Download Modified VASP ——  
  downloadBtn.addEventListener('click',()=>{
    const dacId = orderOutput.innerText.trim();
    if(!dacId) {
      return alert('Please click “Return the DAC ID” first.');
    }
    generateVasp(dacId);
  });

  async function generateVasp(dacId) {
    try {
      const [qv, ele1, ele2, ordersStr] = dacId.split('_');
      const ordersSet = new Set( ordersStr.split('').map(i=>parseInt(i,10)) );

      // 1) fetch and split
      const resp  = await fetch(`${qv}.vasp`);
      const text  = await resp.text();
      const lines = text.split(/\r?\n/);

      // 2) Locate the key POSCAR lines
      //    species line at index 5, counts at 6, "Direct/Cartesian" at 7
      const speciesLineIdx = 5;
      const countsLineIdx  = 6;
      const species  = lines[speciesLineIdx].trim().split(/\s+/);
      const counts   = lines[countsLineIdx ].trim().split(/\s+/).map(Number);

      // 3) Build the new (symbol, count) tuples:
      const tuples = [];
      // → keep the 1st species as-is
      tuples.push([ species[0], counts[0] ]);

      // → break the 2nd species into individual count-1 tuples,
      //    toggling to species[0] when its index is *not* in ordersSet
      for (let i = 0; i < counts[1]; i++) {
        const keep = ordersSet.has(i);
        tuples.push([ keep ? species[1] : species[0], 1 ]);
      }

      // → the “metals” (3rd & 4th) become ele1, ele2
      //    collapse each into a single tuple preserving their original counts
      if (species.length > 2) tuples.push([ele1, counts[2]]);
      if (species.length > 3) tuples.push([ele2, counts[3]]);

      // 4) Rewrite *only* lines 5 and 6
      lines[speciesLineIdx] = tuples.map(t=>t[0]).join('   ');
      lines[countsLineIdx]  = tuples.map(t=>t[1]).join('   ');

      // 5) Download exactly the rest unchanged
      const out = lines.join('\n');
      const blob = new Blob([out], {type:'text/plain'});
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${dacId}.vasp`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } catch(err) {
      console.error(err);
      alert('Error generating VASP: ' + err);
    }
  }


  // —— Animate & resize ——  
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', ()=>{
    camera.aspect = container.clientWidth/ container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

})();
