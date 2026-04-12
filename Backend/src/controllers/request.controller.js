import Request from "../models/Request.js";

/* ================= CREATE REQUEST ================= */
export const createRequest = async (req, res) => {
  try {
    const { subject, topic, description, urgency, maxCredits } = req.body;

    if (!subject || !topic || !maxCredits) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const request = await Request.create({
      studentId: req.user,
      subject,
      topic,
      description,
      urgency,
      maxCredits,
    });

    res.status(201).json({
      success: true,
      request,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET REQUESTS (SEARCH) ================= */
export const getRequests = async (req, res) => {
  try {
    const { subject, search, urgency } = req.query;

    let query = { status: "open" };

    if (subject) {
      query.subject = subject;
    }

    if (urgency) {
      query.urgency = urgency;
    }

    if (search) {
      query.topic = { $regex: search, $options: "i" };
    }

    const requests = await Request.find(query)
      .populate("studentId", "username email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};