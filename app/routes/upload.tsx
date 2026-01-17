
import { prepareInstructions } from '../../constants';
import { s } from 'node_modules/react-router/dist/development/context-DSyS5mLj.mjs';
import { aw } from 'node_modules/react-router/dist/development/routeModules-D5iJ6JYT';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { json } from 'stream/consumers';
import FileUploader from '~/components/FileUploader';
import Navbar from '~/components/Navbar';
import { convertPdfToImage } from '~/lib/pdf2img';
import { usePuterStore } from '~/lib/puter';
import { generateUUID } from '~/lib/utils';

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();

  const [isProcessing, setisProcessing] = useState(false);
  const [statusText, setstatusText] = useState('');
  const [file, setfile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setfile(file);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setisProcessing(true);
    setstatusText('Uploading your resume...');

    const uploadedFile = await fs.upload([file]);
    if(!uploadedFile) return setstatusText("Error : File upload failed.");

    setstatusText('Converting to image...');
    const imageFile = await convertPdfToImage(file);
    if (!imageFile) return setstatusText('Error : PDF to image conversion failed.');

    setstatusText('Uploading the image...');
    const uploadedImage = await fs.upload([imageFile]);
    if(!uploadedImage) return setstatusText("Error : Image upload failed.");

    setstatusText('Preparing analysis...');

    const uuid=generateUUID();
    const data = {
      id : uuid,
      resumePath : uploadedFile.path,
      imagePath : uploadedImage.path,
      companyName,jobTitle,jobDescription,
      feedback: '',
    }

    await kv.set(`resume-${uuid}`, JSON.stringify(data));
    setstatusText('Analyzing your resume...');

    const feedback = await ai.feedback(
      uploadedImage.path,
      prepareInstructions(jobTitle, jobDescription)
    )
    if(!feedback) return setstatusText("Error : AI feedback generation failed.");

    const feedbackText = typeof feedback === 'string' 
    ? feedback.message.content
    :feedback.message.content[0].text;

    data.feedback = JSON.parse(feedbackText);
    await kv.set(`resume-${uuid}`, JSON.stringify(data));
    setstatusText('Analysis complete! Redirecting...');
    console.log
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (!form) return;

    const formData = new FormData(form);

    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    if (!file) return;

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" alt="" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement</h2>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-title">Job : Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
