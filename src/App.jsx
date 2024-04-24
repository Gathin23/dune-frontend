import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

function App() {
  const [requests, setRequests] = useState([]);
  const [results, setResults] = useState([]);
  const [llama2Count, setLlama2Count] = useState(0);
  const [stableDiffusionCount, setStableDiffusionCount] = useState(0);
  const [llama2Percentage, setLlama2Percentage] = useState(0);
  const [stableDiffusionPercentage, setStableDiffusionPercentage] = useState(0);
  const [promptCount, setPromptCount] = useState(0);
  const [simplePromptCount, setSimplePromptCount] = useState(0);
  const [inputOutputs, setInputOutputs] = useState([]);

  let llama2ModelId = "11";
  let stableDiffusionModelId = "50";
  let promptContract = "0xe75af5294f4CB4a8423ef8260595a54298c7a2FB";
  let simplePromptContract = "0x696c83111a49eBb94267ecf4DDF6E220D5A80129";

  useEffect(() => {
    const fetchData = async () => {
      let allRequests = [];
      let allResults = [];
      let hasNextPage = true;
      let skip = 0;

      while (hasNextPage) {
        const requestBody = {
          query: `{
            aicallbackRequests(first: 1000, orderBy: requestId, orderDirection: desc, skip: ${skip}) {
              id
              account
              requestId
              modelId
              transactionHash
              input
            }
            aicallbackResults(first: 1000, orderBy: requestId, orderDirection: desc, skip: ${skip}) {
              requestId
              output
            }
          }`,
        };

        try {
          const response = await fetch(
            "https://api.studio.thegraph.com/query/72067/oao-manifest/version/latest",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            }
          );

          const responseData = await response.json();
          const { aicallbackRequests, aicallbackResults } = responseData.data;
          allRequests = [...allRequests, ...aicallbackRequests];
          allResults = [...allResults, ...aicallbackResults];
          skip += 1000;

          if (aicallbackRequests.length < 1000) {
            hasNextPage = false;
          }
        } catch (error) {
          console.error("Error:", error);
          hasNextPage = false;
        }
      }

      setRequests(allRequests);
      setResults(allResults);

      const llama2Count = allRequests.filter(
        (request) => request.modelId === llama2ModelId
      ).length;
      const stableDiffusionCount = allRequests.filter(
        (request) => request.modelId === stableDiffusionModelId
      ).length;
      const promptCount = allRequests.filter(
        (request) => request.account === promptContract.toLocaleLowerCase()
      ).length;
      const simplePromptCount = allRequests.filter(
        (request) =>
          request.account === simplePromptContract.toLocaleLowerCase()
      ).length;

      setLlama2Count(llama2Count);
      setStableDiffusionCount(stableDiffusionCount);
      setPromptCount(promptCount);
      setSimplePromptCount(simplePromptCount);

      const totalCalls = allRequests.length;
      const llama2Percentage = (llama2Count / totalCalls) * 100;
      const stableDiffusionPercentage =
        (stableDiffusionCount / totalCalls) * 100;

      setLlama2Percentage(llama2Percentage);
      setStableDiffusionPercentage(stableDiffusionPercentage);

      // Extract input and output pairs for the first three requests
      const firstThreeInputOutputs = allRequests.slice(0, 3).map((request) => {
        const result = allResults.find(
          (result) => result.requestId === request.requestId
        );
        return {
          requestId: request.requestId,
          input: ethers.utils.toUtf8String(request.input),
          output: result ? ethers.utils.toUtf8String(result.output) : null,
        };
      });
      setInputOutputs(firstThreeInputOutputs);
    };

    fetchData();
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
  <h2>Summary</h2>
  <p><strong style={{ color: 'red' }}>Total number of OAO requests:</strong> <span style={{ color: 'green' }}>{requests.length}</span></p>
  <p><strong style={{ color: 'red' }}>Llama2 Count:</strong> <span style={{ color: 'green' }}>{llama2Count}</span></p>
  <p><strong style={{ color: 'red' }}>Llama2 Percentage:</strong> <span style={{ color: 'green' }}>{llama2Percentage.toFixed(2)}%</span></p>
  <p><strong style={{ color: 'red' }}>Stable Diffusion Count:</strong> <span style={{ color: 'green' }}>{stableDiffusionCount}</span></p>
  <p><strong style={{ color: 'red' }}>Stable Diffusion Percentage:</strong> <span style={{ color: 'green' }}>{stableDiffusionPercentage.toFixed(2)}%</span></p>
  <p><strong style={{ color: 'red' }}>Calls from Prompt:</strong> <span style={{ color: 'green' }}>{promptCount}</span></p>
  <p><strong style={{ color: 'red' }}>Calls from Simple Prompt:</strong> <span style={{ color: 'green' }}>{simplePromptCount}</span></p>
  
  <h2>Input and Output of the Latest 3 Calls</h2>
  <ul style={{ listStyleType: 'none', padding: '0' }}>
    {inputOutputs.map((pair, index) => (
      <li key={index} style={{ marginBottom: '20px', border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}>
        <p style={{ marginBottom: '5px', color: 'red', fontWeight: 'bold' }}>Request ID: {pair.requestId}</p>
        <p style={{ marginBottom: '5px', color: 'red' }}>Input: {pair.input}</p>
        <p style={{ color: 'green' }}>Output: {pair.output}</p>
      </li>
    ))}
  </ul>
  
  <h2>Indexed Information</h2>
  <pre style={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', padding: '20px', overflowX: 'auto' }}>{JSON.stringify({ requests, results }, null, 2)}</pre>
</div>

  );
}

export default App;
