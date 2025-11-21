// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";

// export default function TwoFactorVerification() {
//   const [code, setCode] = useState(Array(6).fill(""));
//   const navigate = useNavigate();

//   const handleChange = (value, index) => {
//     if (/[^0-9]/.test(value)) return;
//     const newCode = [...code];
//     newCode[index] = value;
//     setCode(newCode);
//   };

//   const handleKeyUp = (e, index) => {
//     if (e.key === "Backspace" && !code[index] && index > 0) {
//       document.getElementById(`otp_${index - 1}`).focus();
//     } else if (code[index] && index < 5) {
//       document.getElementById(`otp_${index + 1}`).focus();
//     }
//   };

//   const handleSubmit = () => {
//     const final = code.join("");
//     if (final.length !== 6) return alert("Enter full 6-digit code");
//     navigate("/dashboard");
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
//       <motion.div
//         initial={{ opacity: 0, scale: 0.9 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ duration: 0.3 }}
//         className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg border"
//       >
//         <div className="flex flex-col items-center">
//           <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
//             <div className="text-purple-600 font-bold text-xl">❤</div>
//           </div>

//           <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
//             Two Step Verification
//           </h2>

//           <p className="text-gray-600 text-center mb-6">
//             We sent a verification code to your registered device.<br />
//             ******1234
//           </p>

//           <div className="flex justify-center gap-3 mb-6">
//             {code.map((digit, index) => (
//               <input
//                 key={index}
//                 id={`otp_${index}`}
//                 maxLength={1}
//                 value={digit}
//                 onChange={(e) => handleChange(e.target.value, index)}
//                 onKeyUp={(e) => handleKeyUp(e, index)}
//                 className="w-12 h-12 text-center text-xl border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//               />
//             ))}
//           </div>

//           <button
//             onClick={handleSubmit}
//             className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-sm font-medium transition-all cursor-pointer"
//           >
//             Verify my account
//           </button>

//           <div className="text-center mt-4 text-sm text-gray-600">
//             Didn't get the code? <span className="text-blue-600 cursor-pointer">Resend</span>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// }
