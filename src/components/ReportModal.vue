<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  >
    <div
      class="bg-white w-full max-w-3xl rounded-lg shadow-xl p-6 overflow-y-auto max-h-[90vh]"
    >
      <!-- Header -->
      <div class="flex justify-between items-center border-b pb-3 mb-4">
        <h2 class="text-lg font-bold">📊 Learning Session Report</h2>
        <button
          class="text-gray-500 hover:text-gray-700 text-2xl"
          @click="$emit('close')"
        >
          &times;
        </button>
      </div>

      <!-- Report Body -->
      <div class="prose max-w-none text-sm" v-html="reportHtml"></div>

      <!-- Footer -->
      <div class="mt-6 flex flex-wrap justify-end gap-1">
        <button
          class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          @click="sendReportByEmail"
        >
          📧 Send Report
        </button>
        <button
          class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          @click="downloadPDF"
        >
          📥 Download PDF
        </button>
        <button
          class="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
          @click="downloadMarkdown"
        >
          📝 Download Markdown
        </button>
        <button
          class="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white"
          @click="copyReport"
        >
          📋 Copy Text
        </button>
        <button
          class="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white"
          @click="$emit('close')"
        >
          Close
        </button>
      </div>

      <div class="text-sm text-gray-500 mt-4">Generated: {{ timestamp }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { jsPDF } from "jspdf";

const props = defineProps({
  show: Boolean,
  chatHistory: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(["close"]);

// timestamp
const timestamp = ref("");

// update timestamp whenever modal is opened
watch(
  () => props.show,
  (val) => {
    if (val) {
      timestamp.value = new Date().toLocaleString();
    }
  }
);

// ---------- Report Generation ----------
const reportHtml = computed(() => createReport(props.chatHistory));

function createReport(history) {
  if (!history.length) {
    return `<p>No conversation to report on.</p>`;
  }

  const now = new Date();
  const duration =
    history.length > 0
      ? Math.round(
          (history[history.length - 1].timestamp - history[0].timestamp) /
            1000 /
            60
        )
      : 0;

  const userMessages = history.filter((m) => m.role === "user");
  const assistantMessages = history.filter((m) => m.role === "assistant");

  let report = `
    <p><strong>Generated:</strong> ${now.toLocaleString()}</p>
    <p><strong>Duration:</strong> ${duration} minutes</p>
    <p><strong>Total Messages:</strong> ${history.length}</p>
    <p><strong>Your Messages:</strong> ${userMessages.length}</p>
    <p><strong>Assistant Responses:</strong> ${assistantMessages.length}</p>

    <h3>💡 Session Summary</h3>
    <p>${generateSummary(history)}</p>

    <h3>📈 Your Contribution Analysis</h3>
    <p>${analyzeContribution(userMessages)}</p>

    <h3>📝 Complete Conversation</h3>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; max-height: 400px; overflow-y: auto;">
  `;

  history.forEach((msg) => {
    report += `
      <div style="margin-bottom: 15px; padding: 10px; background: ${
        msg.role === "user" ? "#e3f2fd" : "#f1f8e9"
      }; border-radius: 6px;">
        <strong>${msg.role === "user" ? "👤 You" : "🤖 Assistant"}:</strong><br>
        ${msg.content.replace(/\n/g, "<br>")}
        <div style="font-size: 0.8em; color: #666; margin-top: 5px;">
            ${msg.timestamp.toLocaleTimeString()}
        </div>
      </div>
    `;
  });

  report += "</div>";

  report += `
    <hr style="margin: 20px 0;">
    <div style="text-align: center; font-size: 0.9rem; color: #666;">
        <strong>Created by:</strong> Dr. Simon Wang, Innovation Officer<br>
        Language Centre, Hong Kong Baptist University<br>
        <a href="mailto:simonwang@hkbu.edu.hk">simonwang@hkbu.edu.hk</a>
    </div>
  `;

  return report;
}

function generateSummary(history) {
  const topics = extractTopics(history);
  const questionsAsked = history.filter(
    (msg) => msg.role === "user" && msg.content.includes("?")
  ).length;

  return `This learning session covered ${
    topics.length > 0 ? topics.join(", ") : "various topics"
  }. You asked ${questionsAsked} questions and engaged in ${Math.floor(
    history.length / 2
  )} conversation exchanges. The session demonstrated active learning through inquiry and discussion.`;
}

function analyzeContribution(userMessages) {
  if (!userMessages.length) return "No user messages to analyze.";

  const avgLength =
    userMessages.reduce((sum, msg) => sum + msg.content.length, 0) /
    userMessages.length;
  const questionsRatio =
    userMessages.filter((msg) => msg.content.includes("?")).length /
    userMessages.length;

  let analysis = "";

  if (avgLength > 100) {
    analysis += "You provided detailed and thoughtful messages. ";
  } else if (avgLength > 50) {
    analysis += "You engaged with good depth in your responses. ";
  } else {
    analysis += "You kept your messages concise and focused. ";
  }

  if (questionsRatio > 0.5) {
    analysis += "You showed excellent curiosity by asking many questions. ";
  } else if (questionsRatio > 0.2) {
    analysis += "You balanced questions with statements effectively. ";
  }

  analysis +=
    "Your engagement shows a positive learning attitude and willingness to explore topics deeply.";

  return analysis;
}

function extractTopics(history) {
  const commonWords = [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "can",
    "may",
    "might",
    "must",
  ];

  const allWords = history
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.content.toLowerCase())
    .join(" ")
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter((word) => word.length > 3 && !commonWords.includes(word));

  const wordCount = {};
  allWords.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

// ---------- Actions ----------
function downloadPDF() {
  const history = props.chatHistory;
  if (!history.length) {
    alert("No conversation to export");
    return;
  }

  const doc = new jsPDF();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.text("HKBU Learning Session Report", 20, yPos);
  yPos += 15;

  // Metadata
  const now = new Date();
  const duration =
    history.length > 0
      ? Math.round(
          (history[history.length - 1].timestamp - history[0].timestamp) /
            1000 /
            60
        )
      : 0;

  doc.setFontSize(12);
  doc.text(`Generated: ${now.toLocaleString()}`, 20, yPos);
  yPos += 7;
  doc.text(`Duration: ${duration} minutes`, 20, yPos);
  yPos += 7;
  doc.text(`Total Messages: ${history.length}`, 20, yPos);
  yPos += 15;

  // Session Summary
  doc.setFontSize(14);
  doc.text("Session Summary", 20, yPos);
  yPos += 7;

  doc.setFontSize(11);
  const summary = generateSummary(history).replace(/[^\x00-\x7F]/g, "");
  const summaryLines = doc.splitTextToSize(summary, 170);
  summaryLines.forEach((line) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(line, 20, yPos);
    yPos += 6;
  });

  yPos += 10;

  // Conversation
  doc.setFontSize(14);
  doc.text("Complete Conversation", 20, yPos);
  yPos += 10;

  doc.setFontSize(11);
  history.forEach((msg) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    // Role
    const role = msg.role === "user" ? "You:" : "Assistant:";
    doc.setFont(undefined, "bold");
    doc.text(role, 20, yPos);
    doc.setFont(undefined, "normal");
    yPos += 6;

    // Message content
    const cleanContent = msg.content.replace(/[^\x00-\x7F]/g, "");
    const lines = doc.splitTextToSize(cleanContent, 170);
    lines.forEach((line) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 20, yPos);
      yPos += 6;
    });

    // Timestamp
    doc.setFontSize(9);
    doc.text(msg.timestamp.toLocaleTimeString(), 20, yPos);
    doc.setFontSize(11);
    yPos += 10;
  });

  // Footer
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  yPos += 10;
  doc.setFontSize(10);
  doc.text("Created by: Dr. Simon Wang, Innovation Officer", 20, yPos);
  yPos += 5;
  doc.text("Language Centre, Hong Kong Baptist University", 20, yPos);
  yPos += 5;
  doc.text("simonwang@hkbu.edu.hk", 20, yPos);

  // Save PDF
  doc.save(
    `HKBU_Learning_Report_${new Date().toISOString().split("T")[0]}.pdf`
  );
}

function downloadMarkdown() {
  const report = createMarkdownReport(props.chatHistory);
  const blob = new Blob([report], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `HKBU_Learning_Report_${
    new Date().toISOString().split("T")[0]
  }.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createMarkdownReport(history) {
  const now = new Date();
  const duration =
    history.length > 0
      ? Math.round(
          (history[history.length - 1].timestamp - history[0].timestamp) /
            1000 /
            60
        )
      : 0;

  let markdown = `# 📊 HKBU Learning Session Report

**Generated:** ${now.toLocaleString()}  
**Duration:** ${duration} minutes  
**Total Messages:** ${history.length}

## 💡 Session Summary

${generateSummary(history)}

## 📈 Your Contribution Analysis

${analyzeContribution(history.filter((m) => m.role === "user"))}

## 📝 Complete Conversation

`;

  history.forEach((msg) => {
    const role = msg.role === "user" ? "👤 **You**" : "🤖 **Assistant**";
    markdown += `### ${role} (${msg.timestamp.toLocaleTimeString()})\n\n${
      msg.content
    }\n\n`;
  });

  markdown += `---
*Created by: Dr. Simon Wang, Innovation Officer*  
*Language Centre, Hong Kong Baptist University*  
*simonwang@hkbu.edu.hk*`;

  return markdown;
}

function copyReport() {
  const el = document.createElement("textarea");
  el.value = reportHtml.value.replace(/<[^>]+>/g, ""); // strip HTML
  document.body.appendChild(el);
  el.select();
  try {
    document.execCommand("copy");
    alert("Report copied to clipboard!");
  } catch (err) {
    alert("Failed to copy report");
  }
  document.body.removeChild(el);
}

const student_email = ref("23257024@life.hkbu.edu.hk");
// const teacher_email = ref("simonwang@hkbu.edu.hk");
const teacher_email = ref("2468668109@qq.com");
const emailSending = ref(false);
const emailSent = ref(false);
import { BASE_URL } from "../components/base_url";

function sendReportByEmail() {
  const history = props.chatHistory;
  if (!history.length) {
    alert("No conversation to export");
    return;
  }
  emailSending.value = true;

  fetch(`${BASE_URL}/sendEmail/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_email: student_email.value,
      teacher_email: teacher_email.value,
      report_md: createMarkdownReport(history),
      report_history: history,
    }),
  })
    .then((response) => {
      if (response.ok) {
        emailSent.value = true;
        alert("Report sent successfully!");
      } else {
        throw new Error("Failed to send email");
      }
    })
    .catch((error) => {
      alert(`Error: ${error.message}`);
    })
    .finally(() => {
      emailSending.value = false;
    });
}
</script>
