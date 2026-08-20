---
marp: true
math: mathjax
theme: report-red
size: 16:9
paginate: true
---
<!-- _class: cover_b -->
<!-- _paginate: "" -->

# 4DSloMo: 4D Reconstruction for High Speed Scene with Asynchronous Capture

<div class="speaker-meta">

<span>Speaker</span> VSPLab 丁麒涵
<small>dingqh2025@shanghaitech.edu.cn</small>

</div>

---
## 1.1 Motivation
现有的 4D 重建系统通常由于成本原因受限于30FPS的帧率，这导致在处理复杂运动如衣物飘动、体育动作时，难以捕捉到足够精细的中间运动信息，从而产生伪影。提高相机硬件帧率成本高昂，且数据传输带宽需求大，为此我们寻找替代方案。

4DSloMo 提出了一种结合**新型数据采集方案**和**先进后处理模块**的软硬件协同方法，旨在**利用低帧率相机实现高帧率的 4D 重建**，并解决由此引入的伪影问题。

---
## 1.2 Hardware: Asynchronous Capture Scheme
<!-- _class: cols-2 -->

<div class=ldiv>

传统的捕获过程是同步的，所有相机在同一时刻启动，以相同帧率捕获图像，因此在两个连续帧之间，运动信息是缺失的。4DSloMo 的 Asynchronous Capture Scheme 将 N 台相机分成 K 组。每组相机在不同的时间点启动，彼此之间存在微小的时间延迟。如右图所示，在同一个时间窗口内，每增加一倍数量的相机，时间分辨率就提高一倍，四组相机意味着将 25FPS 提高到 100FPS，八组相机意味着将 25FPS 提高到 200FPS。

</div>

<div class=rimg>

![w:480 20260119230945](https://picgo-server-vsplab-1328801592.cos.ap-shanghai.myqcloud.com/picgo-server-vsplab-1328801592/Picgo20260119230945.png)

---
## 1.2 Hardware: Asynchronous Capture Scheme
<!-- _class: cols-2 -->

<div class=ldiv>

本文的系统由 12 个以 25 FPS 运行的相机组成，所有相机都能够进行硬件同步触发，团队手动引入了不同的相机触发延迟，以实现异步捕获。

使用上述相机阵列设置，团队捕获了各种高速运动场景，包括舞蹈、体育活动以及快速物体交互，构建了一个数据集，其中包含12个异步记录的多视角视频序列，重点关注非线性和大幅度运动场景。每个视频的分辨率为2048 × 2248像素。

</div>

<div class=rimg>

![20260119233048](https://picgo-server-vsplab-1328801592.cos.ap-shanghai.myqcloud.com/picgo-server-vsplab-1328801592/Picgo20260119233048.png)

---
## 1.3 Software: Artifact-fix Video Diffusion Model
<!-- _class: cols-2 -->
<div class=ldiv>

如图所示，异步捕获虽然将视频捕获的帧率提高了 K 倍，但由于在每个时间戳可用的视角数量减少了 K 倍，导致重建时存在稀疏视角问题，从而在 4D 重建结果中产生浮动伪影。传统的图像扩散模型在处理 4D 场景时，容易导致时间不一致性。

本文提出并训练了一个基于视频扩散模型的伪影修复模块，专门用于解决 4D 稀疏视角重建带来的伪影问题，并保持时间一致性。

</div>

<div class=rimg>

![20260119234759](https://picgo-server-vsplab-1328801592.cos.ap-shanghai.myqcloud.com/picgo-server-vsplab-1328801592/Picgo20260119234759.png)

---
## 1.3 Software: Artifact-fix Video Diffusion Model
<!-- _class: cols-2 -->

<div class=ldiv>

首先，使用初始的GS4D模型，从异步捕获的数据重建出带有伪影的噪声视频。这些视频随后与原始的干净视频进行配对，形成训练数据集。伪影修复模型基于预训练的视频扩散模型 Wan2.1 构建，并使用 LoRA 进行微调。它以带有伪影的渲染视频作为输入，输出时间连贯的干净视频。修复后的干净视频被用于监督模型的优化过程，通过扩散损失函数来引导模型学习如何去除伪影，同时保持时空一致性。

具体来说，本文使用了 DNA-Rendering 和 Neural3DV 等广泛使用的多视角数据集，在时间上下采样以模拟低帧率捕获，然后通过 GS4D 重建出带有伪影的视频，以此作为训练数据。

</div>

<div class=rimg>

![20260120003555](https://picgo-server-vsplab-1328801592.cos.ap-shanghai.myqcloud.com/picgo-server-vsplab-1328801592/Picgo20260120003555.png)

---
## 1.4 Results
<!-- _class: cols-2-64 -->

<div class=ldiv>

本文方法正在两个数据集上都取得了最优的效果。
消融实验表明伪影修复模型对同步捕获的视频没有显著提升。与不使用伪影修复模型的异步捕获相比，伪影修复视频扩散模型能够有效去除浮动伪影，恢复精细纹理，并保持时间一致性。

![20260120004243](https://picgo-server-vsplab-1328801592.cos.ap-shanghai.myqcloud.com/picgo-server-vsplab-1328801592/Picgo20260120004243.png)

</div>

<div class=rdiv>

DNA-Rendering:

![20260120003738](https://picgo-server-vsplab-1328801592.cos.ap-shanghai.myqcloud.com/picgo-server-vsplab-1328801592/Picgo20260120003738.png)

Neural3DV:

![20260120003753](https://picgo-server-vsplab-1328801592.cos.ap-shanghai.myqcloud.com/picgo-server-vsplab-1328801592/Picgo20260120003753.png)

---
## 2.1 LoRA微调

LoRA (Low-Rank Adaptation) 是一种参数高效的微调方法，专为大规模预训练模型设计。

Method： 冻结预训练模型的权重，在Transformer架构的各层注入可训练的秩分解矩阵，大幅减少可训练参数数量。

**Pros：**
- 相比GPT-3 175B全量微调，可训练参数减少10000倍
- GPU显存需求降低3倍
- 在模型性能上与全量微调相当或更优（RoBERTa、DeBERTa、GPT-2、GPT-3等）
- 训练吞吐量更高，推理无额外延迟

---
## 2.2 全量微调的改进
<!-- _class: cols-2 -->

<div class=ldiv>

全量微调中，神经网络表示为 $h = W \cdot x$，全量微调需要每次都更新全部权重矩阵W，对大模型成本极高。

发现并不需要在高维空间更新全部权重矩阵，可以在低秩子空间集中更新。LoRA冻结预训练权重 $W_0$，对参数变化量做低秩分解：

$$h = W_0 \cdot x + AB \cdot x$$

其中 $W_0: n \times m, A: n \times r, B: r \times m$

参数量：
全量微调： $nm$
LoRA微调： $nr + rm = r(m+n)$

</div>

<div class=rdiv>

**Observation：** 实验表明盲目增大r并不能获得更佳效果，因此r有充分理由取小值。

![20260123045409](https://picgo-server-vsplab-1328801592.cos.ap-shanghai.myqcloud.com/picgo-server-vsplab-1328801592/Picgo20260123045409.png)

因此可以确定合适的秩r的取值： $r \in \{1, 2, 4, 8\}$

</div>

---
## 2.3 LoRA对显存的优化
<!-- _class: cols-2 -->

<div class=ldiv>

显存占用来源：
1. 模型参数
2. 激活值（中间结果）
3. 优化器状态和模型梯度

LoRA主要通过减少反向传播时的梯度计算量来节省显存。

- 实现一：
$$Y = XW = X(W_0 + AB)$$

这种方式需要计算完整梯度 $\frac{\partial L}{\partial W}$，才能求出 $\frac{\partial L}{\partial A}$ 和 $\frac{\partial L}{\partial B}$，计算量大，显存占用多。

</div>

<div class=rdiv>

- 实现二：
$$Y = XW_0 + XAB = XW_0 + ZB, \quad Z = XA$$

其中 $X$ 是 $b \times n$ 矩阵，$Y$ 是 $b \times m$ 矩阵。

由于 $W_0$ 被冻结，直接对中间结果求偏导：

$$\frac{\partial L}{\partial A} = X^T \left(\frac{\partial L}{\partial Y} B^T\right)$$

$$\frac{\partial L}{\partial B} = (XA)^T \frac{\partial L}{\partial Y}$$

实现二只需计算损失对Z和Y的偏导，避免计算完整的 $\frac{\partial L}{\partial W}$，既节省显存又节省计算量。

</div>

---
## 2.4 其他参数高效的微调方法
<!-- _class: cols-2 -->

<div class=ldiv>

**Prefix Tuning**

- 在MLP输入层插入可训练的提示向量
- 冻结主模型参数
- 同样用极少参数替代全量模型更新

**劣势：** 输入层有效信息长度减少

</div>

<div class=rdiv>

**Adapter**

- 在Transformer层插入小型适配器模块
- 参数极少，节省显存

**劣势：**
- 必须在原始层输出后执行
- 无法与其他层并行计算
- 模型层数变深，增加训练/推理时间

</div>

---
## 3.1 矩阵范数

**L2范数（F范数）：** 把矩阵的所有元素的平方加起来开根号：

$$\Vert M \Vert_F = \sqrt{\sum_{i=1}^n \sum_{j=1}^m M_{i,j}^2}$$
$$\Vert A \Vert_F^2 = \operatorname{tr}(A^T A)$$

正交变换不改变F范数： 设Q为$m \times m$正交矩阵，A为$m \times n$矩阵：

$$\|QA\|_F^2 = \operatorname{tr}((QA)^T (QA)) = \operatorname{tr}(A^T Q^T Q A) = \operatorname{tr}(A^T A) = \|A\|_F^2$$

这一性质对于奇异值分解和最优低秩近似至关重要。

---
## 3.2 伪逆与最优低秩近似
<!-- _class: cols-2 -->

<div class=ldiv>

已知矩阵A和目标矩阵M，求矩阵B使得：

$$B^* = argmin_B \|AB - M\|_F^2$$

设损失函数 $L = \|AB - M\|_F^2$，对B求偏导：

$$\frac{\partial L}{\partial B} = 2A^T(AB - M) = 0$$

同理，对A求偏导：

$$\frac{\partial L}{\partial A} = 2(AB - M) B^T = 0$$

当 $A^T A$ 可逆时，解得伪逆：
$$B^* = (A^T A)^{-1} A^T M$$

</div>

<div class=rdiv>

奇异值分解方法：对任意 $M \in \mathbb{R}^{m \times n}$，存在分解：
$$M = U\Sigma V^T$$

其中U、V是正交矩阵，$\Sigma$ 是非负对角阵（对角线为奇异值）。利用F范数的正交不变性：
$$\|AB - M\|_F^2 = \|U^T ABV - \Sigma\|_F^2$$

令 $Y = U^T ABV$，则 $AB = UYV^T$

最优r秩近似只需保留：
- U的前r列
- $\Sigma$ 的前r个最大奇异值
- $V^T$ 的前r列

</div>

---
## 3.3 低秩分解的最优性
<!-- _class: cols-2 -->

<div class=ldiv>

对矩阵M的SVD分解 $M = U\Sigma V^T$，其最优r秩近似为：

$$M_r = U_{[:,:r]} \Sigma_{[:r,:r]} V^T_{[:,:r]}$$

1. 取左奇异向量U的前r列（保留r个主要左特征方向）
2. 取奇异值矩阵$\Sigma$的前r阶对角子阵（保留r个最大奇异值）
3. 取右奇异向量$V^T$的前r列（保留r个主要右特征方向）

设秩为r的矩阵的最优近似误差为：
$$\min_{\operatorname{rank}(X)\leq r} \|X - M\|_F^2 = \sum_{i=r+1}^{\min(m,n)} \sigma_i^2$$

只需保留前r个最大奇异值可达到最小误差。

</div>

<div class=rdiv>

**在LoRA中的应用意义：**

预训练权重 $W_0 \in \mathbb{R}^{n \times m}$ 的更新量可表示为：
$$\Delta W = AB$$

其中：
- $A \in \mathbb{R}^{n \times r}$（编码左特征方向）
- $B \in \mathbb{R}^{r \times m}$（编码右特征方向）
- $r \ll \min(n,m)$（秩远小于原维度）

</div>

---
<!-- _class: lastpage -->
<!-- _header: "" -->
<!-- _footer: "" -->
<!-- _paginate: "" -->

###### Thank You

<div class="icons">

- 4DSloMo
- LoRA
- VSP Lab

</div>
