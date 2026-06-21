# **Product 1: JetPump Finder (Mom)**

## **Goal**

Help short-term traders identify and evaluate high-volatility stocks before market open.

The user already receives stock ideas from an investor group. The investor group identifies stocks under roughly $1B market cap that have moved significantly (often \+/-30% or more).

The problem is that evaluating these opportunities manually takes too long. By the time the user researches the stock, the opportunity may already be gone.

The system should reduce research time from 30-60 minutes to under 5 minutes.

---

## **Target User**

Short-term trader.

Not a long-term investor.

The user is looking for:

* Volatile stocks  
* Premarket movers  
* Potential "jetpumps"  
* Short-term trading opportunities

The user is NOT looking for:

* Long-term compounders  
* General investing advice  
* Passive investing recommendations

---

## **Core Workflow**

Every morning before market open:

1. User receives stock symbols from investor groups.  
2. User enters stock symbols into the website.  
3. System generates an AI summary for each stock.

The summary should contain all important information needed to quickly evaluate a trade.

---

## **Required Information For Each Stock**

### **News Summary**

Aggregate and summarize:

* Press releases  
* SEC filings  
* Earnings  
* Patents  
* FDA approvals  
* Partnerships  
* Major contracts  
* Product launches

AI should explain:

* Why the stock moved  
* Whether the catalyst appears meaningful  
* Whether the catalyst appears temporary hype

---

### **Financial Health**

Show:

* Market Cap  
* Revenue  
* Revenue Growth  
* Profitability  
* Cash Position  
* Debt  
* Cash Runway  
* Country

---

### **Volatility Analysis**

Show:

* Historical volatility  
* Previous pump events  
* Previous crashes  
* Typical daily movement  
* Recent volume spikes

Questions to answer:

* Has this stock behaved like this before?  
* Is this move unusual?  
* Does this often happen with this company?

---

### **Dilution Analysis**

Show:

* Recent offerings  
* Recent dilution events  
* Share count changes  
* Insider selling

---

### **Premarket Analysis**

Very important.

Display:

* Premarket %  
* Premarket volume  
* Relative volume  
* Comparison to historical volume

---

### **AI Verdict**

Optional toggle.

Can be disabled.

Example:

Catalyst Strength: 8/10  
Financial Health: 7/10  
Volatility Potential: 9/10

Overall:  
Strong Candidate

or

Likely Hype

or

Potential Dilution Trap

---

## **Outputs**

### **Dashboard**

Primary interface.

User enters symbols.

Results appear as cards.

---

### **Email Summary**

Optional.

Sent before market open.

Contains:

* Entered stocks  
* Top opportunities  
* Important catalysts

---

## **MVP**

Version 1:

* Manual ticker input  
* News aggregation  
* Financial summary  
* Volatility summary  
* AI-generated explanation

No automatic stock discovery yet.

Only summarize stocks user enters.

---

