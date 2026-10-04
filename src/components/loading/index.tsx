import React from "react"
import Lottie from "lottie-react"
import loadingAnimation from "../../../public/images/Cube-loop.json" 

export default function Loading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Lottie 
        animationData={loadingAnimation} 
        loop={true} 
        className="w-40 h-40"  
      />
      {/* <p className="mt-4 text-gray-500 text-sm">Loading...</p> */}
    </div>
  )
}
