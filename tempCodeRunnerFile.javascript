// 原始代码
const formatDate = (requireDeliveryTime) => {
  return new Date(requireDeliveryTime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
};

// 测试方法
function testFormatDate() {
  const testCases = [
    { input: 1723157940000, expected: '2024-08-09 12:59:00' },
    { input: 1640995200000, expected: '2022-01-01 00:00:00' },
    { input: 1735689600000, expected: '2025-01-01 00:00:00' }
  ];

  testCases.forEach((testCase, index) => {
    const result = formatDate(testCase.input);
    if (result === testCase.expected) {
      console.log(`Test case ${index + 1} passed`);
    } else {
      console.error(`Test case ${index + 1} failed. Expected ${testCase.expected}, but got ${result}`);
    }
  });
}

// 运行测试
testFormatDate();
