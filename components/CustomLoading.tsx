"use client";
import React from "react";

interface CustomLoadingProps {
  text?: string;
}

export const CustomLoading: React.FC<CustomLoadingProps> = ({
  text = "LOADING",
}) => {
  const letters = text.split("");

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes loadingAnimate {
            0% {
              transform: translateY(0);
              color: transparent;
              text-shadow: none;
            }
            20% {
              transform: translateY(-60px);
              color: #ff3d00;
              text-shadow: 0 0px 5px red, 0 0 25px red, 0 0 50px red;
            }
            40%, 100% {
              transform: translateY(0);
              color: transparent;
              text-shadow: none;
            }
          }
        `,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f2f2f2",
        }}
      >
        <div
          style={{
            position: "relative",
            cursor: "default",
            WebkitBoxReflect: "below -25px linear-gradient(transparent, #0005)",
          }}
        >
          {letters.map((letter, index) => (
            <span
              key={index}
              style={{
                position: "relative",
                display: "inline-flex",
                fontSize: "3em",
                color: "transparent",
                WebkitTextStroke: "1px #ff3d00",
                textTransform: "uppercase",
                fontWeight: 800,
                animation: "loadingAnimate 3s ease-in-out infinite",
                animationDelay: `${0.15 * index}s`,
              }}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

export default CustomLoading;
