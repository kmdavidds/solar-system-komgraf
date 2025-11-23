export function identifyPlanet(clickedObject, planetMap){
  if (!clickedObject || !planetMap) return { result: null, offset: 0 };
  const { mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto } = planetMap;

  if (clickedObject.material === mercury.planet.material) {
    return { result: mercury, offset: 10 };
  } else if (venus.Atmosphere && clickedObject.material === venus.Atmosphere.material) {
    return { result: venus, offset: 25 };
  } else if (earth.Atmosphere && clickedObject.material === earth.Atmosphere.material) {
    return { result: earth, offset: 25 };
  } else if (clickedObject.material === mars.planet.material) {
    return { result: mars, offset: 15 };
  } else if (clickedObject.material === jupiter.planet.material) {
    return { result: jupiter, offset: 50 };
  } else if (clickedObject.material === saturn.planet.material) {
    return { result: saturn, offset: 50 };
  } else if (clickedObject.material === uranus.planet.material) {
    return { result: uranus, offset: 25 };
  } else if (clickedObject.material === neptune.planet.material) {
    return { result: neptune, offset: 20 };
  } else if (clickedObject.material === pluto.planet.material) {
    return { result: pluto, offset: 10 };
  }

  return { result: null, offset: 0 };
}
