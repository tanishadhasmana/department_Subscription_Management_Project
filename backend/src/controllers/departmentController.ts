import { Request, Response } from "express";
import { getAllDepartmentsService } from "../services/departmentService";
import { responseMessage } from "../utils/responseMessage";

export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await getAllDepartmentsService();
    res.status(200).json({
      success: true,
      message: responseMessage.fetched("Departments"),
      departments,
    });
  } catch (err: any) {
    console.error("Failed to fetch departments:", err);
    res.status(500).json({ message: err.message || "Failed to fetch departments" });
  }
};
