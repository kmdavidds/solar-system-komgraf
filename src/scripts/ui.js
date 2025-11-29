export function showPlanetInfo(planetName, planetData) {
  var info = document.getElementById('planetInfo');
  var name = document.getElementById('planetName');
  var details = document.getElementById('planetDetails');

  name.innerText = planetName;
  details.innerText = `Radius: ${planetData[planetName].radius}\nTilt: ${planetData[planetName].tilt}\nRotation: ${planetData[planetName].rotation}\nOrbit: ${planetData[planetName].orbit}\nDistance: ${planetData[planetName].distance}\nMoons: ${planetData[planetName].moons}\nInfo: ${planetData[planetName].info}`;

  info.style.display = 'block';
}

export function showMoonInfo(moon, planetParent) {
  console.log('showMoonInfo called with moon:', moon, 'parent:', planetParent);
  var info = document.getElementById('planetInfo');
  var name = document.getElementById('planetName');
  var details = document.getElementById('planetDetails');

  name.innerText = moon.name || 'Unknown Moon';
  details.innerText = `Planet Induk: ${planetParent}\nUkuran: ${moon.size ? moon.size + ' unit' : 'Custom model'}\nJarak Orbit: ${moon.orbitRadius ? moon.orbitRadius + ' unit' : 'N/A'}\nKecepatan Orbit: ${moon.orbitSpeed ? moon.orbitSpeed : 'N/A'}`;

  info.style.display = 'block';
  console.log('Moon info displayed');
}

export function closeInfo(settings, controls){
  var info = document.getElementById('planetInfo');
  info.style.display = 'none';
  settings.accelerationOrbit = 1;
  controls.target.set(0, 0, 0);
}

export function closeInfoNoZoomOut(settings){
  var info = document.getElementById('planetInfo');
  info.style.display = 'none';
  settings.accelerationOrbit = 1;
}
