import bcrypt from "bcrypt";
// we make that file for clean reusable and secure code.


// salt round make pass, more more secure hash, so hard hackers to guess the pass, 10 means 2^10=1024 times hashing, and if we inc rnds it also take more time, so become slow hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};


export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  // like a noraml pass like tani123, hash again, and compare wit the stored hash in DB, if march T else F.
  return await bcrypt.compare(password, hashedPassword);
};
