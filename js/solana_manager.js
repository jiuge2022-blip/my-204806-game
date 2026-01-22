function SolanaManager() {
  this.connected = false;
  this.provider = null;
  this.publicKey = null;
  this.connection = null;

  // Initialize connection to Solana mainnet-beta
  if (window.solanaWeb3) {
    this.connection = new window.solanaWeb3.Connection(
      'https://solana-mainnet.g.allthatnode.com/full/evm' 或 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
  }

  this.setupUI();
}

SolanaManager.prototype.setupUI = function() {
  var authSection = document.getElementById('auth-section');
  if (!authSection) return;

  var self = this;

  // Create Guest Mode Button
  var guestBtn = document.createElement('a');
  guestBtn.className = 'wallet-button guest-button';
  guestBtn.innerText = '访客模式';
  guestBtn.style.cursor = 'default';

  // Create Connect Wallet Button
  var connectBtn = document.createElement('a');
  connectBtn.className = 'wallet-button connect-button';
  connectBtn.innerText = '连接钱包';
  connectBtn.addEventListener('click', function() {
    self.connectWallet();
  });

  authSection.appendChild(guestBtn);
  authSection.appendChild(connectBtn);

  this.guestBtn = guestBtn;
  this.connectBtn = connectBtn;
  this.authSection = authSection;
};

SolanaManager.prototype.connectWallet = function() {
  var self = this;
  var provider = window.solana;

  if (!provider) {
    alert('未检测到 Solana 钱包！\n\n请安装 Phantom、Solflare 或使用 Seeker 浏览器的 dApp 功能。');
    return;
  }

  provider.connect()
    .then(function(resp) {
      self.connected = true;
      self.provider = provider;
      self.publicKey = resp.publicKey;
      
      var pubKeyStr = resp.publicKey.toString();
      console.log('Connected to wallet:', pubKeyStr);
      
      // Update UI to show address and logout button
      self.updateUIConnected(pubKeyStr);
    })
    .catch(function(err) {
      console.error('Connection failed:', err);
      if (err.message && err.message.includes('User rejected')) {
        alert('钱包连接已取消');
      } else {
        alert('连接失败：' + (err.message || err));
      }
    });
};

SolanaManager.prototype.updateUIConnected = function(pubKeyStr) {
  var self = this;
  
  // Clear auth section
  this.authSection.innerHTML = '';

  // Create Address Display Button
  var addressBtn = document.createElement('a');
  addressBtn.className = 'wallet-button address-button';
  addressBtn.innerText = pubKeyStr.slice(0, 4) + '...' + pubKeyStr.slice(-4);
  addressBtn.title = pubKeyStr;

  // Create Logout Button
  var logoutBtn = document.createElement('a');
  logoutBtn.className = 'wallet-button logout-button';
  logoutBtn.innerText = '退出';
  logoutBtn.addEventListener('click', function() {
    self.disconnect();
  });

  this.authSection.appendChild(addressBtn);
  this.authSection.appendChild(logoutBtn);
};

SolanaManager.prototype.disconnect = function() {
  var self = this;
  
  if (this.provider && this.provider.disconnect) {
    this.provider.disconnect()
      .then(function() {
        self.resetConnection();
      })
      .catch(function(err) {
        console.error('Disconnect error:', err);
        self.resetConnection();
      });
  } else {
    this.resetConnection();
  }
};

SolanaManager.prototype.resetConnection = function() {
  this.connected = false;
  this.provider = null;
  this.publicKey = null;
  
  // Reset UI to guest mode
  this.authSection.innerHTML = '';
  this.setupUI();
  
  console.log('Disconnected from wallet');
};

SolanaManager.prototype.saveScoreToChain = function(score) {
  console.log('Attempting to save score:', score);

  if (!this.connected || !this.provider || !this.publicKey) {
    alert('请先连接钱包才能将成绩上链！');
    return;
  }

  if (!this.connection) {
    alert('网络连接错误：Solana 连接未初始化');
    return;
  }

  var self = this;
  var solana = window.solanaWeb3;
  var MEMO_PROGRAM_ID = new solana.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

  // Find and disable the save button
  var saveBtn = document.querySelector('.save-score-button');
  if (saveBtn) {
    saveBtn.classList.add('disabled');
    saveBtn.innerText = '上链中...';
  }

  // Create memo data
  var memoData = JSON.stringify({
    app: 'skr2048',
    score: score
  });

  this.connection.getLatestBlockhash()
    .then(function(hashInfo) {
      var transaction = new solana.Transaction({
        feePayer: self.publicKey,
        recentBlockhash: hashInfo.blockhash
      });

      // Add Memo instruction
      transaction.add(
        new solana.TransactionInstruction({
          keys: [{ pubkey: self.publicKey, isSigner: true, isWritable: true }],
          programId: MEMO_PROGRAM_ID,
          data: new TextEncoder().encode(memoData)
        })
      );

      return self.provider.signAndSendTransaction(transaction);
    })
    .then(function(signature) {
      var txId = signature.signature || signature;
      console.log('Score saved on-chain! Tx:', txId);
      
      if (saveBtn) {
        saveBtn.innerText = '上链成功！';
      }
      
      alert('成绩已成功上链！\n\n分数: ' + score + '\n交易签名: ' + txId.slice(0, 8) + '...' + txId.slice(-8));
    })
    .catch(function(err) {
      console.error('Failed to save score:', err);
      
      if (saveBtn) {
        saveBtn.classList.remove('disabled');
        saveBtn.innerText = '将成绩上链';
      }
      
      if (err.message && err.message.includes('User rejected')) {
        alert('交易已取消');
      } else {
        alert('上链失败：' + (err.message || err));
      }
    });

};
