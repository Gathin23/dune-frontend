import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

function App() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [results, setResults] = useState([]);
  const [llama2Count, setLlama2Count] = useState(0);
  const [stableDiffusionCount, setStableDiffusionCount] = useState(0);
  const [llama2Percentage, setLlama2Percentage] = useState(0);
  const [stableDiffusionPercentage, setStableDiffusionPercentage] = useState(0);
  const [promptCount, setPromptCount] = useState(0);
  const [simplePromptCount, setSimplePromptCount] = useState(0);
  const [inputOutputs, setInputOutputs] = useState([]);
  const [totalRequestGas, setTotalRequestGas] = useState(0);
  const [totalResultGas, setTotalResultGas] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueLast30Days, setRevenueLast30Days] = useState(0);
  const [highestDailyRevenue, setHighestDailyRevenue] = useState(0);
  const [currencyType, setCurrencyType] = useState("ETH");
  const [ethPriceInUSD, setEthPriceInUSD] = useState(0);


  let llama2ModelId = "11";
  let stableDiffusionModelId = "50";
  let promptContract = "0xe75af5294f4CB4a8423ef8260595a54298c7a2FB";
  let simplePromptContract = "0x696c83111a49eBb94267ecf4DDF6E220D5A80129";

  useEffect(() => {
    
    const fetchEthPriceInUSD = async () => {
      try {
        const response = await fetch(
          "https://api.coincap.io/v2/assets/ethereum"
        );
        const data = await response.json();
        const ethPrice = data.data.priceUsd;
        setEthPriceInUSD(parseFloat(ethPrice));
      } catch (error) {
        console.error("Error fetching ETH price:", error);
      }
    };
    

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
              gasPrice
              gasUsed
              cumulativeGasUsed
              value
              blockTimestamp
            }
            aicallbackResults(first: 1000, orderBy: requestId, orderDirection: desc, skip: ${skip}) {
              requestId
              output
              gasPrice
              gasUsed
              cumulativeGasUsed
              blockTimestamp
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

      const totalValue = allRequests.reduce((sum, request) => {
        return sum + parseFloat(ethers.utils.formatEther(request.value));
      }, 0);
      setTotalRevenue(totalValue);

      const currentDate = new Date().getTime() / 1000; // Current timestamp in seconds
      const thirtyDaysAgo = currentDate - 30 * 24 * 60 * 60; // 30 days ago timestamp
      const revenueLast30Days = allRequests.reduce((sum, request) => {
        if (parseInt(request.blockTimestamp) > thirtyDaysAgo) {
          return sum + parseFloat(ethers.utils.formatEther(request.value));
        } else {
          return sum;
        }
      }, 0);
      setRevenueLast30Days(revenueLast30Days);

      //To calculate highest daily revenue
      const revenueByDay = allRequests.reduce((acc, request) => {
        const date = new Date(request.blockTimestamp * 1000).toISOString().split('T')[0];
        const value = parseFloat(ethers.utils.formatEther(request.value));
        acc[date] = (acc[date] || 0) + value;
        return acc;
      }, {});
  
      const highestDailyRevenue = Math.max(...Object.values(revenueByDay));
      setHighestDailyRevenue(highestDailyRevenue);
      
      const totalRequestGas = allRequests.reduce((sum, request) => {
        const gasUsed = ethers.BigNumber.from(request.gasUsed);
        const gasPrice = ethers.BigNumber.from(request.gasPrice);
        const product = gasUsed.mul(gasPrice);
        return sum + parseFloat(ethers.utils.formatEther(product));
      }, 0);
      setTotalRequestGas(totalRequestGas);

      const totalResultGas = allResults.reduce((sum, result) => {
        const gasUsed = ethers.BigNumber.from(result.gasUsed);
        const gasPrice = ethers.BigNumber.from(result.gasPrice);
        const product = gasUsed.mul(gasPrice);
        return sum + parseFloat(ethers.utils.formatEther(product));
      }, 0);
      setTotalResultGas(totalResultGas);

      setLoading(false);

    };

    fetchEthPriceInUSD();
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '20px',
        color: '#333'
      }}>
        Fetching the realtime data please wait around 10-15 seconds....
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        backgroundColor: "#f0f0f0",
        borderRadius: "8px",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2>Summary</h2>
      <p>
        <strong style={{ color: "red" }}>Total number of OAO requests:</strong>{" "}
        <span style={{ color: "green" }}>{requests.length}</span>
      </p>
      <p>
        <strong style={{ color: "red" }}>Llama2 Count:</strong>{" "}
        <span style={{ color: "green" }}>{llama2Count}</span>
      </p>
      <p>
        <strong style={{ color: "red" }}>Llama2 Percentage:</strong>{" "}
        <span style={{ color: "green" }}>{llama2Percentage.toFixed(2)}%</span>
      </p>
      <p>
        <strong style={{ color: "red" }}>Stable Diffusion Count:</strong>{" "}
        <span style={{ color: "green" }}>{stableDiffusionCount}</span>
      </p>
      <p>
        <strong style={{ color: "red" }}>Stable Diffusion Percentage:</strong>{" "}
        <span style={{ color: "green" }}>
          {stableDiffusionPercentage.toFixed(2)}%
        </span>
      </p>
      <p>
        <strong style={{ color: "red" }}>Calls from Prompt:</strong>{" "}
        <span style={{ color: "green" }}>{promptCount}</span>
      </p>
      <p>
        <strong style={{ color: "red" }}>Calls from Simple Prompt:</strong>{" "}
        <span style={{ color: "green" }}>{simplePromptCount}</span>
      </p>
      <div style={{ marginTop: "20px" }}>
  <button 
    style={{ background: currencyType === "ETH" ? "green" : "white" }} 
    onClick={() => setCurrencyType("ETH")}
  >
    ETH
  </button>
  <button 
    style={{ background: currencyType === "USD" ? "green" : "white" }} 
    onClick={() => setCurrencyType("USD")}
  >
    USD
  </button>
</div>
      <p>
        <strong style={{ color: "red" }}>{`Total Gas Spent (total model Revenue + callback gas + request gas): `}</strong>{" "}
        <span style={{ color: "green" }}>   {(currencyType === "ETH"
            ? totalRequestGas + totalResultGas + totalRevenue
            : (totalRequestGas + totalResultGas + totalRevenue) * ethPriceInUSD
          ).toFixed(2)}</span>
      </p>
      <p>
        <strong style={{ color: "red" }}>{`Total Revenue (Total Modal Fee) :`}</strong>{" "}
        <span style={{ color: "green" }}>{(currencyType === "ETH" ? totalRevenue : totalRevenue * ethPriceInUSD).toFixed(2)}</span>
      </p>
      <p>
        <strong style={{ color: "red" }}>{`Total Revenue (Last 30 days) :`}</strong>{" "}
        <span style={{ color: "green" }}>{(currencyType === "ETH" ? revenueLast30Days : revenueLast30Days * ethPriceInUSD).toFixed(2)}</span>
      </p>
      <p>
        <strong style={{ color: "red" }}>Highest Daily Revenue:</strong>{" "}
        <span style={{ color: "green" }}>{(currencyType === "ETH" ? highestDailyRevenue : highestDailyRevenue * ethPriceInUSD).toFixed(2)}</span>
      </p>
      <h2>Input and Output of the Latest 3 Calls</h2>
      <ul style={{ listStyleType: "none", padding: "0" }}>
        {inputOutputs.map((pair, index) => (
          <li
            key={index}
            style={{
              marginBottom: "20px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "10px",
            }}
          >
            <p
              style={{ marginBottom: "5px", color: "red", fontWeight: "bold" }}
            >
              Request ID: {pair.requestId}
            </p>
            <p style={{ marginBottom: "5px", color: "red" }}>
              Input: {pair.input}
            </p>
            <p style={{ color: "green" }}>Output: {pair.output}</p>
          </li>
        ))}
      </ul>

      <h2>Indexed Information</h2>
      <pre
        style={{
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "20px",
          overflowX: "auto",
        }}
      >
        {JSON.stringify({ requests, results }, null, 2)}
      </pre>
    </div>
  );
}

export default App;
