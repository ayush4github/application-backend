require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Correct answers
const correctAnswers = {
    "1": ["1a", "1d"], "2": ["2a", "2d"], "3": ["3b", "3d"], "4": ["4a", "4d"],
    "5": ["5a", "5c"], "6": ["6a", "6d"], "7": ["7a", "7d"], "8": ["8b"],
    "9": ["9a", "9d"], "10": ["10a", "10c"], "11": ["11a"], "12": ["12a", "12e"]
};

// Function to check answers
function checkAnswers(userResponses) {
    let correctCount = 0;
    Object.keys(correctAnswers).forEach(q => {
        if (arraysEqual(userResponses[q] || [], correctAnswers[q])) {
            correctCount++;
        }
    });
    return correctCount;
}

// Helper function to compare arrays
function arraysEqual(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every(value => arr2.includes(value));
}

// API Endpoint to process quiz submission
app.post("/submit-quiz", async (req, res) => {
    const { userResponses, discordId } = req.body;

    if (!userResponses || !discordId) {
        return res.status(400).json({ error: "All fields are required!" });
    }

    const correctCount = checkAnswers(userResponses);
    const resultText = correctCount >= 8 ? "Pass" : "Fail";

    // Prepare Discord messages
    const fullResponseMessage = `**SASP Quiz Completed!**\n**Score:** ${correctCount}/12\n**Result:** ${resultText}\n**User:** <@${discordId}>\n**Responses:**\n${JSON.stringify(userResponses, null, 2)}`;
    const shortMessage = resultText === "Pass"
        ? `Congratulations! Your application has been selected for an interview, <@${discordId}>.`
        : `Your application is rejected, <@${discordId}>. You can re-apply after 12 hours.`;

    try {
        // Send full response to the first webhook
        await axios.post(process.env.FULL_RESPONSE_WEBHOOK, { content: fullResponseMessage });

        // Send pass/fail message to the second webhook
        await axios.post(process.env.RESULT_WEBHOOK, { content: shortMessage });

    } catch (error) {
        console.error("Error sending to Discord:", error);
    }

    // Send response to frontend
    res.json({ result: resultText, correctCount });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
