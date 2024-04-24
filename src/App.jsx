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
    <div>
      <p>Total number of OAO requests: {requests.length}</p>
      <p>Llama2 Count: {llama2Count}</p>
      <p>Llama2 Percentage: {llama2Percentage.toFixed(2)}%</p>
      <p>Stable Diffusion Count: {stableDiffusionCount}</p>
      <p>
        Stable Diffusion Percentage: {stableDiffusionPercentage.toFixed(2)}%
      </p>{" "}
      <p>Calls from prompt: {promptCount}</p>
      <p>Calls from Simple Prompt: {simplePromptCount}</p>
      <p>Input and output of the latest 3 calls:</p>
      <ul>
        {inputOutputs.map((pair, index) => (
          <li key={index}>
            <p>Request ID: {pair.requestId}</p>
            <p>Input: {pair.input}</p>
            <p>Output: {pair.output}</p>
          </li>
        ))}
      </ul>
      <pre>{JSON.stringify({ requests, results }, null, 2)}</pre>
    </div>
  );
}

export default App;
