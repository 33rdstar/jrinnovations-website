import React from 'react';

const AnimatedBackground = () => {
  const triangles = [
    { size: 200, color: 'rgba(239, 68, 68, 0.25)', top: '10%', left: '5%', duration: 8 },
    { size: 150, color: 'rgba(168, 85, 247, 0.25)', top: '20%', right: '10%', duration: 10 },
    { size: 180, color: 'rgba(34, 197, 94, 0.25)', top: '50%', left: '15%', duration: 12 },
    { size: 120, color: 'rgba(251, 146, 60, 0.25)', top: '70%', right: '20%', duration: 9 },
    { size: 160, color: 'rgba(236, 72, 153, 0.25)', top: '35%', right: '5%', duration: 11 },
    { size: 140, color: 'rgba(59, 130, 246, 0.25)', top: '80%', left: '25%', duration: 13 },
    { size: 190, color: 'rgba(234, 179, 8, 0.25)', top: '15%', left: '60%', duration: 10 },
    { size: 130, color: 'rgba(20, 184, 166, 0.25)', top: '60%', right: '30%', duration: 14 },
    { size: 170, color: 'rgba(244, 63, 94, 0.25)', top: '40%', left: '40%', duration: 9 },
    { size: 110, color: 'rgba(139, 92, 246, 0.25)', top: '85%', right: '15%', duration: 11 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {triangles.map((triangle, index) => (
        <div
          key={index}
          className="absolute animate-float-fade"
          style={{
            top: triangle.top,
            left: triangle.left,
            right: triangle.right,
            width: `${triangle.size}px`,
            height: `${triangle.size}px`,
            animation: `floatFade ${triangle.duration}s ease-in-out infinite`,
            animationDelay: `${index * 0.5}s`,
          }}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            style={{
              filter: 'blur(1px)',
            }}
          >
            <polygon
              points="50,10 90,90 10,90"
              fill={triangle.color}
              style={{
                transform: `rotate(${index * 36}deg)`,
                transformOrigin: 'center',
              }}
            />
          </svg>
        </div>
      ))}
      
      <style jsx="true">{`
        @keyframes floatFade {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.9);
          }
          25% {
            opacity: 0.6;
            transform: translateY(-20px) scale(1.05);
          }
          50% {
            opacity: 1;
            transform: translateY(-10px) scale(1);
          }
          75% {
            opacity: 0.6;
            transform: translateY(-30px) scale(1.05);
          }
          100% {
            opacity: 0;
            transform: translateY(0) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;