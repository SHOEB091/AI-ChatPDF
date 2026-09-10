import { getEmbeddings } from "./gemini-embeddings";

// Generic fallback data when Pinecone can't be used
const genericFallbackContext = `
I'm an AI assistant that can help you analyze and discuss documents.
I can answer questions about the content you've uploaded, provide summaries,
explain concepts, and help you understand the material better.

Please note: I'm currently unable to access the specific content of your uploaded document
due to a technical issue. You may want to try uploading the document again or contact support.`;

SKILLS
Programming Languages: JavaScript, TypeScript, Python, Java
Full-Stack Development: MERN Stack (MongoDB, Express.js, React.js, Node.js), REST APIs, HTML, CSS
System Design: Scalable Architecture, Microservices, API Design, Caching, Load Balancing
DevOps: Docker, GitHub Actions, Nginx, Redis, Basic Kubernetes
CI/CD: Pipeline Setup, Git Workflows, Automated Deployment, Basic Monitoring
Cloud Platforms: AWS (EC2, S3, Lambda), Firebase
Databases: PostgreSQL, MySQL, MongoDB
Tools: Git, Postman, Linux, VS Code, Strapi
Soft Skills: Problem Solving, Communication, Team Collaboration

EXPERIENCE
Software Engineer, Jan 2025 - Present
Bridge Group Solutions, Gurugram, India
• Interbook Assessment Platform: Developed a real-time evaluation Project on ASP.NET and certificate generation system, reducing recruitment costs by 45% and cutting hiring time from 3 weeks to 7 days.
• Strengthened platform security with anti-cheat monitoring and file validation, achieving a 98% drop in incidents across 10,000+ assessments.
• Built CI/CD pipelines using Jenkins and auto-scaling EC2 instances, reducing AWS infrastructure costs by 35% and enabling daily deployments with 99.9% uptime.
• Designed a scalable microservices architecture with Redis caching and optimized queries, resulting in a 300% increase in system capacity and handling 5,000+ concurrent users.
• Cross-Platform HR Management System: Developed using Python (Fast), achieving 70% reduction in deployment complexity by delivering a single codebase for Android, Windows, Linux, and macOS.
• Achieved 99.8% feature parity across platforms with responsive UI and device-specific optimizations, enabling seamless access for 200+ employees.
• Engineered secure login with PBKDF2 password hashing and integrated real-time analytics dashboards, leading to 45% faster HR operations and 60% less manual work.

/**
 * Fallback context retrieval when Pinecone isn't available
 */
export async function getContextFallback(query: string) {
  try {
    // Return generic fallback context since we don't have vector search
    return genericFallbackContext;
  } catch (error) {
    console.error("Error in fallback context retrieval:", error);
    return "";
  }
}

export default getContextFallback;
