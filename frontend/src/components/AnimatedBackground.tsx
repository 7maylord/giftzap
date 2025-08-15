interface AnimatedBackgroundProps {
  children: React.ReactNode;
}

export default function AnimatedBackground({ children }: AnimatedBackgroundProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Circles */}
        <div className="absolute w-96 h-96 bg-primary/20 rounded-full -top-48 -left-48 animate-float-slow"></div>
        <div className="absolute w-96 h-96 bg-accent/20 rounded-full -bottom-48 -right-48 animate-float-slow delay-1000"></div>
        
        {/* Gradient Orbs */}
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-primary/30 to-accent/30 rounded-full top-1/4 -left-1/4 blur-3xl animate-pulse-slow"></div>
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-accent/30 to-primary/30 rounded-full bottom-1/4 -right-1/4 blur-3xl animate-pulse-slow delay-1000"></div>
        
        {/* Light Beams */}
        <div className="absolute top-0 left-1/3 w-2 h-full bg-gradient-to-b from-primary/0 via-primary/20 to-primary/0 animate-beam-slide"></div>
        <div className="absolute top-0 right-1/3 w-2 h-full bg-gradient-to-b from-accent/0 via-accent/20 to-accent/0 animate-beam-slide delay-500"></div>
        <div className="absolute top-1/3 left-0 w-full h-2 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 animate-beam-slide-horizontal"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
