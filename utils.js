class Utils {
  static saludar(nombre) {
    return `Hola, ${nombre}!`;
  }

  static sumar(a, b) {
    return a + b;
  }

  static validarEmail(email) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
  }

}

module.exports =  Utils;