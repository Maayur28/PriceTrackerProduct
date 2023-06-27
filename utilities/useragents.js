const getUserAgents = (maxLimit) => {
  let rand = Math.floor(Math.random() * maxLimit);
  return rand;
};
module.exports = getUserAgents;
