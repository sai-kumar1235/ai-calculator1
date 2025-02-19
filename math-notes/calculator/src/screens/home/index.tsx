import {useRef,useState,useEffect} from 'react';
import {SWATCHES} from '@/constants.ts'; 
import { ColorSwatch,Group } from '@mantine/core';
import Draggable from 'react-draggable';
import { Button } from '@/components/ui/button.tsx';
import axios from 'axios';
interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}
 function Home(){
    const canvasRef=useRef<HTMLCanvasElement>(null);
    const [isDrawing,setIsDrawing]=useState(false);
    const [color,setColor]=useState('rgb(255,255,255');
    const [reset,setReset]=useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [latexExpression,setLatexExpression]=useState<Array<string>>([]);
    const [latexPosition,setLatexPosition]=useState({x:0,y:200});
    const [result, setResult] = useState<GeneratedResult>();
    useEffect(()=>{
        if(result){
            renderLatexToCanvas(result.expression,result.answer);
        }
    },[result]);
    useEffect(()=>{
        const canvas=canvasRef.current;
        if(canvas){
            const ctx=canvas.getContext('2d');
            if(ctx){
                canvas.width=window.innerWidth;
                canvas.height=window.innerHeight-canvas.offsetTop;
                ctx.lineCap='round';
                ctx.lineWidth=5;
            }
        }
        const script=document.createElement('script');
        script.src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML";
        script.async=true;
        document.head.appendChild(script);
        script.onload=()=>{
            window.MathJax.Hub.Config({
                tex2jax:{inlineMath:[['$','$'],['\\(','\\)']]},

            })
        };
        return()=>{
            document.head.removeChild(script);
        }
    },[]);
    useEffect(()=>{
        if(reset){
            resetCanvas();
            setLatexExpression([]);
            setDictOfVars({});
            setResult(undefined);
            
            setReset(false);
        }
        
    },[reset]);

    useEffect(()=>{
        if(latexExpression.length>0 && window.MathJax){
            window.MathJax.Hub.Queue(['Typeset',window.MathJax.Hub]);
        }
    },[latexExpression])
    const resetCanvas=()=>{
        const canvas=canvasRef.current;
        if(canvas){
            const ctx=canvas.getContext('2d');
            if(ctx){
                ctx.clearRect(0,0,canvas.width,canvas.height);
            }
        }
        
    }
    const renderLatexToCanvas=(expression:string,answer:string)=>{
        for(let i=0;i<expression.length;i++){
            if(expression[i]===' '){
                expression=expression.slice(0,i)+'\\:'+expression.slice(i+1);
            }
        }
        const latex=`\\({${ expression } = ${ answer }} \\)`;
        setLatexExpression([...latexExpression,latex]);
        const canvas=canvasRef.current;
        if(canvas){
            const ctx=canvas.getContext('2d');
            if(ctx){
                ctx.clearRect(0,0,canvas.width,canvas.height);
            }
        }
        console.log(expression);
    }
    const sendData = async () => {
        const canvas = canvasRef.current;
        
        ;
        if (canvas) {
            console.log(canvas.toDataURL('image/png'));
            const response = await axios({
                method: 'post',
                
                url: `${import.meta.env.VITE_API_URL}/calculate`,
                data: {
                    img: canvas.toDataURL('image/png'),  // Change 'image' to 'img'
                    dict_of_vars: dictOfVars,
                }
            });
    
            const resp = await response.data;
            console.log('Response', resp);
            resp.data.forEach((data: Response) => {
                if (data.assign === true) {
                    setDictOfVars({
                        ...dictOfVars,
                        [data.expr]: data.result+" "
                    });
                }
            });
        const ctx=canvas.getContext('2d');
        const imageData=ctx!.getImageData(0,0,canvas.width,canvas.height);
        let minX=canvas.width;
        let minY=canvas.height;
        let maxX=0;
        let maxY=0;
        for(let y=0;y<canvas.height;y++){
            for(let x=0;x<canvas.width;x++){
                const i = (y * canvas.width + x) * 4;
                if (imageData.data[i + 3] > 0) {  // If pixel is not transparent
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            setLatexPosition({ x: centerX, y: centerY });
            resp.data.forEach((data: Response) => {
                setTimeout(() => {
                    setResult({
                        expression: data.expr,
                        answer: data.result
                    });
                    console.log(data.expr);
                }, 1000);
            });
        }
        
    };
    const startDrawing=(e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas=canvasRef.current;
        if(canvas){
            canvas.style.background='black';
            const ctx=canvas.getContext('2d');
            if(ctx){
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX,e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    };
    const stopDrawing=()=>{
        setIsDrawing(false);
    };
    const draw=(e: React.MouseEvent<HTMLCanvasElement>)=>{
        if(!isDrawing){
            return
        }
        const canvas=canvasRef.current;
        if(canvas){
            const ctx=canvas.getContext('2d');
            if(ctx){
                ctx.strokeStyle=color;
                ctx.lineTo(e.nativeEvent.offsetX,e.nativeEvent.offsetY);
                ctx.stroke();

            }

        }
    };
    return(<>


        <div className='grid grid-cols-3 gap-2' >
        <Button
            onClick={() => setReset(true)}
            className='z-20 bg-black text-white'
            variant='default' 
            color='black'>
            Reset
            </Button>
            <Group className='z-20'>
                    {SWATCHES.map((swatch) => (
                        <ColorSwatch key={swatch} color={swatch} onClick={() => setColor(swatch)} />
                    ))}
                </Group>
            <Button
            onClick={sendData}
            className='z-20 bg-black text-white'
            variant='default' 
            color='black'>
            Calculate
            </Button>
        </div>

        <canvas
        ref={canvasRef}
        id='canvas'
        className='absolute top-0 left-0 w-full h-full'
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        >
        
        </canvas>
        {latexExpression && latexExpression.map((latex, index) => (
                <Draggable
                    key={index}
                    defaultPosition={latexPosition}
                    onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
                >
                    <div className="absolute p-2 text-white rounded shadow-md">
                        <div className="latex-content">{latex}</div>
                    </div>
                </Draggable>
            ))}
    
    
    </>)
}
export default Home;