const URL="./model/";

let model;
let webcam;

let puerto;
let escritor;
let arduinoConectado = false;


//temporizador

let objetoActual="";
let tiempoInicio=0;
let activado=false;



//funcion de la camara

async function iniciar(){


const modelURL=URL+"model.json";
const metadataURL=URL+"metadata.json";


model=await tmImage.load(
    modelURL,
    metadataURL
);


console.log("Modelo cargado");



webcam=new tmImage.Webcam(
    400,
    400,
    true
);



await webcam.setup();

await webcam.play();



document
.getElementById("camara")
.appendChild(webcam.canvas);



detectar();


}








async function detectar(){


webcam.update();



const predicciones =
await model.predict(webcam.canvas);



let clase="";
let confianza=0;



for(let i=0;i<predicciones.length;i++){


    if(predicciones[i].probability > confianza){

        confianza = predicciones[i].probability;

        clase = predicciones[i].className;

    }


}



document.getElementById("resultado").innerHTML =
clase+
"<br>"+
(confianza*100).toFixed(1)+"%";




//tick de tiempo (espera)


if(confianza > 0.85 && clase!="Nada"){



    if(objetoActual != clase){


        objetoActual = clase;

        tiempoInicio = Date.now();


    }



    let tiempo =
    (Date.now()-tiempoInicio)/1000;



    if(tiempo >= 5 && !activado){


        activado=true;



        if(clase=="Plastico"){


            enviarArduino("A");


        }



        if(clase=="Papel y Carton"){


            enviarArduino("B");


        }




        // espera 10 segundos
        

        setTimeout(()=>{


            activado=false;


        },10000);



    }



}
else{


    objetoActual="";


}



requestAnimationFrame(detectar);



}





//conectar arduinos


async function conectarArduino(){


try{


if(!navigator.serial){


alert("Este navegador no soporta Arduino");


return;


}



puerto =
await navigator.serial.requestPort();



await puerto.open({

baudRate:9600

});



escritor =
puerto.writable.getWriter();



arduinoConectado=true;



document.getElementById("arduino").innerHTML =
"Arduino: Conectado ✅";



//detectar desconexion

puerto.addEventListener(
"disconnect",
desconectarArduino
);



console.log("Arduino conectado");



}

catch(error){


console.log(error);


document.getElementById("arduino").innerHTML =
"Arduino: Desconectado ❌";


}



}








function desconectarArduino(){



arduinoConectado=false;



document.getElementById("arduino").innerHTML =
"Arduino: Desconectado ❌";



escritor=null;

puerto=null;



console.log("Arduino desconectado");



}







//enviar datos al arduino



async function enviarArduino(dato){



if(!arduinoConectado || !escritor){


console.log(
"No hay Arduino conectado"
);


return;


}



try{


await escritor.write(

new TextEncoder().encode(dato)

);



}

catch(error){


console.log(error);


desconectarArduino();


}



}