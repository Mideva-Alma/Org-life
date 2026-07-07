import { useState, useEffect } from "react";
import "./dashboardtour.css";

export default function DashboardTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    {
      title: "👋 Welcome to Org-Life!",
      description: "Let's take a quick tour of your dashboard. Click 'Next' to continue.",
      target: "dashboard-title",
      position: "bottom"
    },
    {
      title: "💰 Your Balance",
      description: "This shows your total balance - income minus expenses. Keep an eye on this number!",
      target: "stat-balance",
      position: "bottom"
    },
    {
      title: "📈 Income & 📉 Expenses",
      description: "Track how much you're earning and spending. Green is income, red is expenses.",
      target: "stats-grid",
      position: "bottom"
    },
    {
      title: "📋 Recent Transactions",
      description: "All your recent expenses and income appear here. Click 'Add Entry' to record new ones.",
      target: "recent-section",
      position: "top"
    },
    {
      title: "🎯 Your Profile",
      description: "Click here to manage your account settings and sign out.",
      target: "sidebar-footer",
      position: "right"
    },
    {
      title: "✅ You're All Set!",
      description: "You're ready to start tracking your finances. Happy budgeting!",
      target: "complete",
      position: "center"
    }
  ];

  const current = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
      localStorage.setItem('orglife_tour_completed', 'true');
      if (onComplete) onComplete();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('orglife_tour_completed', 'true');
    if (onComplete) onComplete();
  };

  useEffect(() => {
    // Show tour only if user hasn't completed it
    const tourCompleted = localStorage.getItem('orglife_tour_completed');
    if (tourCompleted === 'true') {
      setIsVisible(false);
      if (onComplete) onComplete();
    }
  }, [onComplete]);

  if (!isVisible) return null;

  // Position the tooltip
  const getTooltipPosition = () => {
    if (current.target === 'complete') return 'center';
    return current.position || 'bottom';
  };

  return (
    <>
      {/* Overlay */}
      <div className="tour-overlay" onClick={handleSkip}>
        <div className="tour-overlay-bg"></div>
      </div>

      {/* Tooltip */}
      <div className={`tour-tooltip tour-${getTooltipPosition()}`}>
        <div className="tour-progress">
          {steps.map((_, index) => (
            <span 
              key={index} 
              className={`tour-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="tour-content">
          <h3>{current.title}</h3>
          <p>{current.description}</p>
        </div>

        <div className="tour-actions">
          <button className="tour-skip" onClick={handleSkip}>
            Skip Tour
          </button>
          <button className="tour-next" onClick={handleNext}>
            {currentStep === steps.length - 1 ? "Got it! 🎉" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}