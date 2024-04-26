"use strict";

// Core Node.js modules

// NPM modules
//TODO possibly import js file to make deprecation error go aways
//import punycode from 'punycode'
import axios from 'axios';
import path from 'path';
import fs from 'fs';

// Canvas API Functions
const canvasDomain = 'https://sultanschools.instructure.com';
//const canvasDomain = 'https://sultanschools.beta.instructure.com';
const apiToken = '13475~QD9FM8Z0PDpvwc7YcgJGI7DHsHvDynQbZG5LNxmRGW2woXi0mdPALvuhTSdbP080'; 
const courseId = '11567'; //SEF Scholarship 2024

/*
const assignmentIds = [
    '148837', 
    '148839', 
    '148770', 
    '148771', 
    '148840', 
    '148842',
    '153363', 
    '157357'
];  
*/

// Function to get all assignments for our course ID
async function getAssignmentsForCourse() {
    try {
        console.log(`****Getting assignments for course ${courseId}`);
        const response = await axios.get(`${canvasDomain}/api/v1/courses/${courseId}/assignments`, {
            headers: { Authorization: `Bearer ${apiToken}` }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching submissions:", error);
        return null;
    }
}


// Function to get all submissions for a specific assignment
async function getSubmissionsForAssignment(courseId, assignment) {
    try {
        console.log(`****Getting submissions for assignment ${assignment.name}`);

        const response = await axios.get(`${canvasDomain}/api/v1/courses/${courseId}/assignments/${assignment.id}/submissions?include[]=user&include[]=attachments&per_page=100`, {
            headers: { Authorization: `Bearer ${apiToken}` }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching submissions:", error);
        return null;
    }
}

// Get a submission from Canvas and store it in file system
async function downloadFile(url, filePath) {
    const writer = fs.createWriteStream(filePath);
  
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: { Authorization: `Bearer ${apiToken}` }
    });
  
    response.data.pipe(writer);
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
  
  // File name on local machine
  function createFileName(file, assignment, f) {
    var fn;
    if (assignment.name.trim().toUpperCase() === "ACCEPTANCE LETTERS") {
        fn = "AL_" + file.display_name;
    } else {
        var ft;
        var ext = file.display_name.slice(-5).toUpperCase(); 
        if (ext === ".DOCX") {
            ft = ".docx";
        } else {
            ft = ".pdf"; // assume .pdf if not .docx
        }

        // Differentiate multiple submissions for same assignment. 
        // Not needed for Letters of Acceptance.
        let fileEnumerator = "";
        if (f > 1) {
            fileEnumerator = "(" + (f - 1) + ")";
        }
        fn = assignment.name.trim() + fileEnumerator + ft;
    }
    return fn;
}

  async function handleSubmissions(courseId) {
    const assignments = await getAssignmentsForCourse();
    for (let assignment of assignments) {
      const submissions = await getSubmissionsForAssignment(courseId, assignment);
      for (let submission of submissions) {
        if (submission.attachments) {
          const studentName = submission.user.sortable_name;
          const studentFolder = `./downloads/${studentName}`;
  
          if (!fs.existsSync(studentFolder)){
            fs.mkdirSync(studentFolder, { recursive: true });
          }
  
          let numFiles = Object.keys(submission.attachments).length;
          let f = 0;
          for (let file of submission.attachments) {
            // We assume file naming includes the assignment or another unique identifier
            const filePath = path.join(studentFolder, createFileName(file, assignment, f));
            await downloadFile(file.url, filePath);
            console.log(`Downloaded '${file.display_name}' to '${filePath}'`);
            f++;
          }
        }
      }
    }
  }
  
  handleSubmissions(courseId);
  
/*

*/