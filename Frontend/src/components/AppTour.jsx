import React, { useState, useEffect } from "react";
import Joyride, { STATUS, EVENTS } from "react-joyride";
import { useNavigate, useLocation } from "react-router-dom";

const AppTour = ({ runTour, setRunTour }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    {
      target: "body",
      content: (
        <div>
          <h2 className="text-lg font-bold mb-2">
            Welcome to Inventory Forecast System!
          </h2>
          <p>
            Let's take a quick tour of the main features to help you get
            started.
          </p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
      data: {
        route: "/",
      },
    },
    {
      target: '[data-tour="understock-card"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Understock Items</h3>
          <p>
            This card shows the number of products that are running low on stock
            for the week. These items need immediate attention for restocking.
          </p>
        </div>
      ),
      placement: "bottom",
      data: {
        route: "/",
      },
    },
    {
      target: '[data-tour="overstock-card"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Overstock Items</h3>
          <p>
            This card displays products that have excess inventory for the week.
            Consider slowing down procurement for these items.
          </p>
        </div>
      ),
      placement: "bottom",
      data: {
        route: "/",
        next: "/inventory",
      },
    },
    {
      target: '[data-tour="forecast-dropdown"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Forecast Period Selection</h3>
          <p>
            Use this dropdown to select different forecast periods: 1 day, 7
            days, or 30 days to view predictions for different timeframes.
          </p>
        </div>
      ),
      placement: "bottom",
      disableBeacon: true,
      data: {
        route: "/inventory",
        previous: "/",
      },
    },
    {
      target: '[data-tour="forecast-column"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Forecast Column</h3>
          <p>
            This column shows the predicted sales for each product based on the
            selected forecast period. It helps you plan inventory levels.
          </p>
        </div>
      ),
      placement: "left",
      data: {
        route: "/inventory",
        previous: "/inventory",
      },
    },
    {
      target: '[data-tour="stock-status-column"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Stock Status</h3>
          <p>
            This column indicates whether each product is understocked,
            overstocked, or has optimal stock levels based on forecasted demand.
          </p>
        </div>
      ),
      placement: "left",
      data: {
        route: "/inventory",
        previous: "/inventory",
        next: "/purchase",
      },
    },
    {
      target: '[data-tour="purchase-table"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Purchase Orders Table</h3>
          <p>
            This table displays all your purchase orders. You can view order
            details, status, and manage your procurement activities here.
          </p>
        </div>
      ),
      placement: "bottom",
      disableBeacon: true,
      data: {
        route: "/purchase",
        previous: "/inventory",
      },
    },
    {
      target: '[data-tour="create-purchase-btn"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Create New Purchase Order</h3>
          <p>
            Click this button to create a new purchase order. You can add
            products and quantities based on your inventory needs.
          </p>
        </div>
      ),
      placement: "bottom",
      data: {
        route: "/purchase",
        previous: "/purchase",
        next: "/sales",
      },
    },
    {
      target: '[data-tour="sales-table"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Sales Records Table</h3>
          <p>
            This table shows all your sales transactions. Track your sales
            performance and analyze customer purchase patterns.
          </p>
        </div>
      ),
      placement: "bottom",
      disableBeacon: true,
      data: {
        route: "/sales",
        previous: "/purchase",
      },
    },
    {
      target: '[data-tour="create-sales-btn"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Record New Sale</h3>
          <p>
            Use this button to record new sales transactions. Keep your sales
            data up-to-date for accurate forecasting.
          </p>
        </div>
      ),
      placement: "bottom",
      data: {
        route: "/sales",
        previous: "/sales",
      },
    },
  ];

  // Helper function to wait for element to be available
  const waitForElement = (selector, timeout = 5000) => {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        resolve(true);
        return;
      }

      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(true);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Timeout fallback
      setTimeout(() => {
        observer.disconnect();
        resolve(false);
      }, timeout);
    });
  };

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type, step } = data;
    const { data: stepData } = step;
    const isPreviousAction = action === "prev";

    console.log("Joyride callback:", { action, index, status, type, stepData });

    // Handle target not found
    if (type === EVENTS.TARGET_NOT_FOUND) {
      console.log(`Target not found for step ${index}: ${step.target}`);
      return;
    }

    // Handle step progression with navigation
    if (type === EVENTS.STEP_AFTER) {
      // Determine next route based on action
      let nextRoute = null;
      let currentRoute = location.pathname; // Store current route before navigation

      if (isPreviousAction && stepData?.previous) {
        nextRoute = stepData.previous;
      } else if (!isPreviousAction && stepData?.next) {
        nextRoute = stepData.next;
      }

      // If navigation is needed
      if (nextRoute && nextRoute !== currentRoute) {
        console.log(`Navigating from ${currentRoute} to: ${nextRoute}`);
        setRunTour(false); // Stop tour before navigation
        navigate(nextRoute);

        // Resume tour after navigation with appropriate step index
        setTimeout(() => {
          let targetStepIndex;

          if (isPreviousAction) {
            // Going backwards - find the last step of the previous route
            const previousRouteSteps = steps
              .map((s, i) => ({ step: s, index: i }))
              .filter(({ step }) => step.data?.route === nextRoute);

            // Find the step that has 'next' pointing to the route we came from
            const targetStep = previousRouteSteps.find(
              ({ step }) => step.data?.next === currentRoute
            );

            targetStepIndex = targetStep
              ? targetStep.index
              : previousRouteSteps[previousRouteSteps.length - 1]?.index || 0;
          } else {
            // Going forwards - find the first step of the next route
            targetStepIndex = steps.findIndex(
              (s) => s.data?.route === nextRoute
            );
          }

          console.log(
            `Setting step index to: ${targetStepIndex} for route: ${nextRoute}`
          );
          setStepIndex(targetStepIndex >= 0 ? targetStepIndex : 0);
          setRunTour(true); // Resume tour
        }, 1500); // Increased timeout to allow for page load
        return;
      }

      // Normal progression without navigation
      if (isPreviousAction) {
        setStepIndex(Math.max(0, index - 1));
      } else {
        setStepIndex(index + 1);
      }
    }

    // Handle tour completion
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      setStepIndex(0);
    }
  };

  useEffect(() => {
    if (!runTour) return;

    const currentStep = steps[stepIndex];
    if (!currentStep) return;

    // Check if we're on the correct route for the current step
    const expectedRoute = currentStep.data?.route;
    if (expectedRoute && expectedRoute === location.pathname) {
      // Wait for the target element to be available
      if (currentStep.target !== "body") {
        waitForElement(currentStep.target).then((found) => {
          if (!found) {
            console.warn(`Element not found: ${currentStep.target}`);
            // If element is not found, try to find a fallback step for this route
            const fallbackStepIndex = steps.findIndex(
              (s) => s.data?.route === location.pathname && s.target === "body"
            );
            if (fallbackStepIndex >= 0) {
              setStepIndex(fallbackStepIndex);
            }
          }
        });
      }
    } else if (expectedRoute) {
      // If we're not on the correct route, navigate there
      console.log(
        `Route mismatch. Expected: ${expectedRoute}, Current: ${location.pathname}`
      );
      if (expectedRoute !== location.pathname) {
        navigate(expectedRoute);
      }
    }
  }, [runTour, stepIndex, location.pathname, steps, navigate]);

  // Resume tour after navigation
  useEffect(() => {
    if (!runTour) return;

    const currentStep = steps[stepIndex];
    if (!currentStep) return;

    // Check if we're on the correct route for the current step
    const expectedRoute = currentStep.data?.route;
    if (expectedRoute && expectedRoute === location.pathname) {
      // Wait for the target element to be available
      if (currentStep.target !== "body") {
        waitForElement(currentStep.target).then((found) => {
          if (!found) {
            console.warn(`Element not found: ${currentStep.target}`);
          }
        });
      }
    }
  }, [runTour, stepIndex, location.pathname, steps]);

  return (
    <Joyride
      steps={steps}
      run={runTour}
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      disableOverlayClose={true}
      hideCloseButton={true}
      styles={{
        options: {
          primaryColor: "#2563eb",
          textColor: "#374151",
          backgroundColor: "#ffffff",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          arrowColor: "#ffffff",
          zIndex: 1000,
        },
        tooltip: {
          borderRadius: "8px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          color: "#1f2937",
        },
        tooltipContent: {
          padding: "12px 0",
        },
        buttonNext: {
          backgroundColor: "#2563eb",
          borderRadius: "6px",
          padding: "8px 16px",
        },
        buttonBack: {
          color: "#6b7280",
          marginRight: "8px",
        },
        buttonSkip: {
          color: "#6b7280",
        },
      }}
      locale={{
        back: "Previous",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
};

export default AppTour;
