import socket from './socket';
import { useEffect, useRef, useState } from 'react';

export default function Canvas() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentStroke, setCurrentStroke] = useState(2);
  const [startX, setStartX] = useState (0);
  const [startY, setStartY] = useState(0);
  const [canvasSnapshot, setCanvasSnapshot] = useState(null);
  const [currentTool, setCurrentTool] = useState('pen');
  const [history, setHistory] = useState([]);
const [historyStep, setHistoryStep] = useState(0);
  
useEffect(() => {
  socket.on('connect', () => {
    console.log('connected to server:', socket.id);
  });
  return () => {
    socket.off('connect');
  };
}, []);

  useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 100;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  document.body.style.margin = '0';
  document.body.style.padding = '0';

  // Initial blank canvas ko history mein save karo
  const initialSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  setHistory([initialSnapshot]);
  setHistoryStep(0);
}, []);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d'); 

    ctx.globalCompositeOperation = 'source-over';

    //save canvas snapshot for line/rectangle preview
    if (currentTool === 'line' || currentTool === 'rectangle') { 
    setCanvasSnapshot(ctx.getImageData(0,0, canvas.width, canvas.height));
}
    setStartX(x);
    setStartY(y);
    if (currentTool === 'pen') {
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x,y);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentStroke;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';

if (currentTool === 'pen' || currentTool === 'eraser') {
    ctx.lineTo (x,y);
  ctx.stroke();
}
else if (currentTool === 'line') {
  // restore canvas and draw preview line
ctx.putImageData(canvasSnapshot,0,0);
ctx.beginPath();
ctx.moveTo(startX, startY);
ctx.lineTo(x,y);
ctx.stroke();
} else if (currentTool === 'rectangle') {
  // restore canvas and draw preview rectangle
  ctx.putImageData(canvasSnapshot, 0,0);
  const width = x - startX;
  const height = y- startY;
  ctx.strokeRect(startX, startY, width, height);

}
};
const handleMouseUp = () => {
  setIsDrawing(false);

  // Current canvas state ko history mein add karo
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Agar pehle undo kia tha, toh future steps delete ho jaate hain
  const newHistory = history.slice(0, historyStep + 1);
  newHistory.push(snapshot);
  
  setHistory(newHistory);
  setHistoryStep(newHistory.length - 1);
}; 

const handleUndo = () => {
  if (historyStep > 0) {
    const newStep = historyStep - 1;
    setHistoryStep(newStep);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(history[newStep], 0, 0);
  }
};

const handleRedo = () => {
  if (historyStep < history.length - 1) {
    const newStep = historyStep + 1;
    setHistoryStep(newStep);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(history[newStep], 0, 0);
  }
};



  return (
    <div>
      {/* Toolbar */}

      <div style={{
        padding: '10px',
        backgroundColor: '#f0f0f0',
        borderBottom: '1px solid #ccc',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Tool Button */}
        <div style = {{ display: 'flex', gap: '5px'}}>
          <button
          onClick={() => setCurrentTool('pen')}
          style={{
            padding: '8px 12px',
              backgroundColor: currentTool === 'pen' ? '#007bff' : '#ddd',
              color: currentTool === 'pen' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✏️ Pen
          </button>
          <button
            onClick={() => setCurrentTool('line')}
            style={{
              padding: '8px 12px',
              backgroundColor: currentTool === 'line' ? '#007bff' : '#ddd',
              color: currentTool === 'line' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📏 Line
          </button>
          <button
            onClick={() => setCurrentTool('rectangle')}
            style={{
              padding: '8px 12px',
              backgroundColor: currentTool === 'rectangle' ? '#007bff' : '#ddd',
              color: currentTool === 'rectangle' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ▭ Rectangle
          </button>
        </div>

        <button
  onClick={() => setCurrentTool('eraser')}
  style={{
    padding: '8px 12px',
    backgroundColor: currentTool === 'eraser' ? '#007bff' : '#ddd',
    color: currentTool === 'eraser' ? 'white' : 'black',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }}
>
  🧹 Eraser
</button>


{/* Undo/Redo Buttons */}
<div style={{ display: 'flex', gap: '5px' }}>
  <button
    onClick={handleUndo}
    disabled={historyStep === 0}
    style={{
      padding: '8px 12px',
      backgroundColor: historyStep === 0 ? '#ccc' : '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: historyStep === 0 ? 'not-allowed' : 'pointer',
      fontWeight: 'bold'
    }}
  >
    ↶ Undo
  </button>
  <button
    onClick={handleRedo}
    disabled={historyStep === history.length - 1}
    style={{
      padding: '8px 12px',
      backgroundColor: historyStep === history.length - 1 ? '#ccc' : '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: historyStep === history.length - 1 ? 'not-allowed' : 'pointer',
      fontWeight: 'bold'
    }}
  >
    ↷ Redo
  </button>
</div>

        {/* Color Picker */}
        <label>
          Color:
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            style={{ marginLeft: '5px', cursor: 'pointer' }}
          />
        </label>
      
          Stroke Width:
          <label>
          <input
            type="range"
            min="1"
            max="20"
            value={currentStroke}
            onChange={(e) => setCurrentStroke(Number(e.target.value))}
            style={{ marginLeft: '5px' }}
          />
          <span style={{ marginLeft: '5px' }}>{currentStroke}px</span>
        </label>
      </div> 

      {/*canvas*/}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: 'block',
          border: '1px solid #ccc',
          cursor: 'crosshair'
        }}
      />
    </div>
  );
}
