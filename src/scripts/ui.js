export function showPlanetInfo(planetName, planetData) {
  var info = document.getElementById('planetInfo');
  var name = document.getElementById('planetName');
  var details = document.getElementById('planetDetails');

  name.innerText = planetName;
  details.innerText = `Radius: ${planetData[planetName].radius}\nTilt: ${planetData[planetName].tilt}\nRotation: ${planetData[planetName].rotation}\nOrbit: ${planetData[planetName].orbit}\nDistance: ${planetData[planetName].distance}\nMoons: ${planetData[planetName].moons}\nInfo: ${planetData[planetName].info}`;

  info.style.display = 'block';
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
