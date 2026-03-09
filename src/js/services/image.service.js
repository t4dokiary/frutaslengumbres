class ImageService {
  static compressToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.onload = event => {
        const img = new Image();
        img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scaleSize = 200 / img.width;
          canvas.width = 200;
          canvas.height = img.height * scaleSize;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
}
