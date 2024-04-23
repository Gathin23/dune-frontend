import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState([]);
  const [totalRequestCount, setTotalRequestCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      let allData = [];
      let hasNextPage = true;
      let skip = 0;

      while (hasNextPage) {
        const requestBody = {
          query: `{
            aicallbackResults(first: 1000, skip: ${skip}) {
              id
              account
              requestId
              invoker
            }
          }`
        };

        try {
          const response = await fetch('https://api.studio.thegraph.com/query/72067/oao-manifest/version/latest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          const responseData = await response.json();
          const requests = responseData.data.aicallbackResults;
          allData = [...allData, ...requests];
          skip += 1000;
          setTotalRequestCount(allData.length);

          if (requests.length < 1000) {
            hasNextPage = false;
          }
        } catch (error) {
          console.error('Error:', error);
          hasNextPage = false;
        }
      }

      setData(allData);
    };

    fetchData();
  }, []);

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <p>Total number of requests: {totalRequestCount}</p>
    </div>
  );
}

export default App;
