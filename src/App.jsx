import React, { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState([]);
  const [llama2Count, setLlama2Count] = useState(0);
  const [stableDiffusionCount, setStableDiffusionCount] = useState(0);
  const [llama2Percentage, setLlama2Percentage] = useState(0);
  const [stableDiffusionPercentage, setStableDiffusionPercentage] = useState(0);
  const [promptCount, setPromptCount] = useState(0);
  const [simplePromptCount, setSimplePromptCount] = useState(0);

  let llama2ModelId = "11";
  let stableDiffusionModelId = "50";
  let promptContract = "0xe75af5294f4CB4a8423ef8260595a54298c7a2FB";
  let simplePromptContract = "0x696c83111a49eBb94267ecf4DDF6E220D5A80129";

  useEffect(() => {
    const fetchData = async () => {
      let allData = [];
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
          const requests = responseData.data.aicallbackRequests;
          allData = [...allData, ...requests];
          skip += 1000;

          if (requests.length < 1000) {
            hasNextPage = false;
          }
        } catch (error) {
          console.error("Error:", error);
          hasNextPage = false;
        }
      }

      setData(allData);

      // Count occurrences of modelID 50, 11, and accounts for Prompt and SimplePrompt
      const llama2Count = allData.filter(
        (request) => request.modelId === llama2ModelId
      ).length;
      const stableDiffusionCount = allData.filter(
        (request) => request.modelId === stableDiffusionModelId
      ).length;
      const promptCount = allData.filter(
        (request) => request.account === promptContract.toLocaleLowerCase()
      ).length;
      const simplePromptCount = allData.filter(
        (request) =>
          request.account === simplePromptContract.toLocaleLowerCase()
      ).length;

      setLlama2Count(llama2Count);
      setStableDiffusionCount(stableDiffusionCount);
      setPromptCount(promptCount);
      setSimplePromptCount(simplePromptCount);

      const totalCalls = allData.length;
      const llama2Percentage = (llama2Count / totalCalls) * 100;
      const stableDiffusionPercentage = (stableDiffusionCount / totalCalls) * 100;

      setLlama2Percentage(llama2Percentage);
      setStableDiffusionPercentage(stableDiffusionPercentage);
    };

    fetchData();
  }, []);

  return (
    <div>
      <p>Total number of OAO requests: {data.length}</p>

      <p>Llama2 Count: {llama2Count}</p>
      <p>Llama2 Percentage: {llama2Percentage.toFixed(2)}%</p>

      <p>Stable Diffusion Count: {stableDiffusionCount}</p>
      <p>
        Stable Diffusion Percentage: {stableDiffusionPercentage.toFixed(2)}%
      </p>
      <p>Integrated Contract Call Counts:</p>
      <p>Calls from prompt: {promptCount}</p>
      <p>Calls from Simple Prompt: {simplePromptCount}</p>

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default App;
