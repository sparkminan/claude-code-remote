import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';

const Terminal: React.FC = () => {
  const { terminalLines, connectWebSocket } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connectWebSocket();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLines]);

  return (
    <div className="terminal-container" ref={scrollRef}>
      {terminalLines.map((line) => (
        <div key={line.id} className={`terminal-line ${line.type}`}>
          {line.text}
        </div>
      ))}
    </div>
  );
};

export default Terminal;