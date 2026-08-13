# Data card · PLAID NASA Rotor 37

- 来源：Hugging Face `PLAID-datasets/Rotor37`（CC BY-SA）
- 物理：三维 RANS，跨音速压气机转子，设计转速量级 17188.7 rpm
- 仓库使用：约 1000 组带标签样本 → `backend/data/processed/plaid_rotor37_features.csv`
- 官方 test 200 组标签隐藏，不能用来报 R²
- 特征：29,773 表面节点 × 9 场量压成 74 维统计量，丢掉空间分布
- 输出：Compression_ratio, Efficiency, Massflow
- 未包含：结构、热、振动、寿命、制造公差
