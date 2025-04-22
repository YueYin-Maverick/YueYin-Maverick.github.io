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
  const orderOutput  = document.getElementById('orderOutput');
  const menu         = document.getElementById('metalMenu');

  // —— Pick JSON ——  
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

  // build lookup maps
  const elementColorMap  = {};
  const elementRadiusMap = {};
  elementColorsList.forEach(({ element, color, radius }) => {
    elementColorMap[element]  = new THREE.Color(color);
    elementRadiusMap[element] = radius;
  });
  // ensure C/N/M have a default color & radius
  elementColorMap["C"] = new THREE.Color("#888888");
  elementColorMap["N"] = new THREE.Color("#0000FF");
  elementRadiusMap["C"] = elementRadiusMap["C"] || 70;
  elementRadiusMap["N"] = elementRadiusMap["N"] || 70;

  // for normalizing radii → px
  const maxRadius = Math.max(...elementColorsList.map(e => e.radius));

  // —— Three.js boilerplate ——  
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(
    45, container.clientWidth/container.clientHeight, 1, 10000
  );
  camera.position.set(0,0,600);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  scene.add(new THREE.AmbientLight(0x888888));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(1,1,1);
  scene.add(dirLight);

  // —— Load data & build atoms ——  
  const data = await fetch(jsonFile).then(r => r.json());
  const metalSites = data.filter(d => d.class === 'M');
  if (metalSites.length >= 2) {
    metalSites[0].element = 'Ag';
    metalSites[1].element = 'Au';
  }
  let nCount = 1;
  data.forEach(d => { if (d.class === 'N') d.order = nCount++; });

  // compute scaled positions
  const xs = data.map(d => d.x), ys = data.map(d => d.y);
  const [Xmin, Xmax] = [Math.min(...xs), Math.max(...xs)];
  const [Ymin, Ymax] = [Math.min(...ys), Math.max(...ys)];
  const scale = (v,mn,mx) => ((v - mn)/(mx - mn) - 0.5) * 400;
  data.forEach(d => {
    d._pos = new THREE.Vector3(
      scale(d.x, Xmin, Xmax),
      scale(d.y, Ymin, Ymax),
      0
    );
  });

  // build atom meshes
  const atomGroup = new THREE.Group();
  data.forEach(d => {
    // fallback color/radius if map missing
    const col = elementColorMap[d.element] || elementColorMap[d.class] || new THREE.Color(0x888888);
    const mat = new THREE.MeshLambertMaterial({ color: col });

    const pm  = elementRadiusMap[d.element] !== undefined
              ? elementRadiusMap[d.element]
              : 70;
    const px  = (pm / maxRadius) * (defaultAtomRadius / 2);
    if (!Number.isFinite(px)) {
      console.error("Bad radius for", d.element, pm, maxRadius);
    }
    const geo = new THREE.SphereGeometry(px, 16, 16);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(d._pos);
    mesh.userData = { data: d };
    atomGroup.add(mesh);
    d._mesh = mesh;
  });
  scene.add(atomGroup);

  // —— Bi‑color bond builder ——  
  function makeBiColorBond(aPos, bPos, colorA, colorB, radius) {
    const dir     = new THREE.Vector3().subVectors(bPos, aPos);
    const len     = dir.length();
    const dirNorm = dir.clone().normalize();
    const halfLen = len / 2;

    const geo1 = new THREE.CylinderGeometry(radius, radius, halfLen, 8, 1);
    const matA = new THREE.MeshLambertMaterial({ color: colorA });
    const meshA = new THREE.Mesh(geo1, matA);
    const posA  = aPos.clone().add(dirNorm.clone().multiplyScalar(halfLen / 2));
    meshA.position.copy(posA);
    meshA.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dirNorm);

    const geo2 = new THREE.CylinderGeometry(radius, radius, halfLen, 8, 1);
    const matB = new THREE.MeshLambertMaterial({ color: colorB });
    const meshB = new THREE.Mesh(geo2, matB);
    const posB  = aPos.clone().add(dirNorm.clone().multiplyScalar(halfLen + halfLen/2));
    meshB.position.copy(posB);
    meshB.quaternion.copy(meshA.quaternion);

    const grp = new THREE.Group();
    grp.add(meshA, meshB);
    return grp;
  }

  // —— Bond rebuild logic ——  
  const bondGroup = new THREE.Group();
  scene.add(bondGroup);
  function rebuildBonds(cnDist, cmDist) {
    bondGroup.clear();
    data.forEach((a, i) => {
      data.slice(i+1).forEach(b => {
        const dist    = a._pos.distanceTo(b._pos);
        const bothNon = a.class!=='M' && b.class!=='M';
        const oneM    = (a.class==='M') !== (b.class==='M');
        if ((bothNon && dist<=cnDist) || (oneM && dist<=cmDist)) {
          const colA = elementColorMap[a.element] || elementColorMap[a.class] || new THREE.Color(0x888888);
          const colB = elementColorMap[b.element] || elementColorMap[b.class] || new THREE.Color(0x888888);
          bondGroup.add(
            makeBiColorBond(a._pos, b._pos, colA, colB, defaultLineWidth/10)
          );
        }
      });
    });
  }
  rebuildBonds(defaultCnCutoff, defaultCmCutoff);

  // —— Raycaster helper ——  
  const ray     = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function getIntersect(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX-rect.left)/rect.width)*2 - 1;
    pointer.y = -((event.clientY-rect.top)/rect.height)*2 + 1;
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObjects(atomGroup.children);
    return hits.length ? hits[0].object : null;
  }

  // —— Right‑click handling ——  
  renderer.domElement.addEventListener('contextmenu', event => {
    event.preventDefault();
    const mesh = getIntersect(event);
    if (!mesh) return;
    const d = mesh.userData.data;

    if (d.class === 'M') {
      openMetalMenu(event.clientX, event.clientY, mesh);
    } else {
      // toggle C/N
      d.class = (d.class==='N') ? 'C' : 'N';
      mesh.material.color.copy(elementColorMap[d.class]);
      rebuildBonds(defaultCnCutoff, defaultCmCutoff);
    }
  });

  // —— Metal menu in grid ——  
  function openMetalMenu(x, y, mesh) {
    menu.innerHTML = '';
    menu.style.left = `${x}px`;
    menu.style.top  = `${y}px`;

    Object.keys(elementColorMap)
      .filter(el => el!=='C' && el!=='N')
      .forEach(opt => {
        const btn = document.createElement('div');
        btn.textContent = opt;
        btn.addEventListener('click', () => {
          // update data & color
          mesh.userData.data.element = opt;
          mesh.material.color.copy(
            elementColorMap[opt] || new THREE.Color(0x888888)
          );

          // rebuild sphere at new radius
          const pmNew = elementRadiusMap[opt] !== undefined
                      ? elementRadiusMap[opt]
                      : 70;
          const pxNew = (pmNew / maxRadius) * (defaultAtomRadius / 2);
          mesh.geometry.dispose();
          mesh.geometry = new THREE.SphereGeometry(pxNew, 16, 16);

          menu.classList.remove('visible');
          rebuildBonds(defaultCnCutoff, defaultCmCutoff);
        });
        menu.appendChild(btn);
      });

    menu.classList.add('visible');
  }

  // hide menu on outside click
  window.addEventListener('click', e => {
    if (!menu.contains(e.target)) menu.classList.remove('visible');
  });

  // —— Show N orders ——  
  showOrderBtn.addEventListener('click', () => {
    // 1) Grab the QV label from the title
    const qv = titleEl.innerText;

    // 2) Get the first two metal elements
    const metalSites = data.filter(d => d.class === 'M');
    const metals = metalSites.slice(0, 2).map(m => m.element);

    // 3) Collect all the N‑orders
    const orders = data
      .filter(d => d.class === 'N')
      .map(d => d.order - 1);

    // 4) Render in your output div
    orderOutput.innerText =
      `${qv}_${metals.join('_')}_${orders.join('')}`;
  });

  // —— Animate & resize ——  
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', ()=>{
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

})();
