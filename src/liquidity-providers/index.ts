import { ContractManager } from "../contract";
import { config } from "../config";
import { HyphenProvider } from "../providers";
import { BigNumber, Contract, ethers } from "ethers";

export type LiquidityProvidersManagerParams = {
    provider: HyphenProvider,
}

export interface LiquidityPosition {
    token: string;
    suppliedLiquidity: BigNumber;
    shares: BigNumber;
}

export class LiquidityProvidersManager extends ContractManager {
    provider: HyphenProvider;

    constructor(params: LiquidityProvidersManagerParams) {
        super();
        this.provider = params.provider;
    }

    public async addNativeLiquidity(request: AddNativeLiquidityRequest) {
        const liquidityProvidersContract = await this.getLiquidityProvidersContract(request.liquidityProvidersAddress);
        await liquidityProvidersContract.addNativeLiquidity({ value: request.amount });
    }

    public async addTokenLiquidity(request: AddTokenLiquidityRequest) {
        const liquidityProvidersContract = await this.getLiquidityProvidersContract(request.liquidityProvidersAddress);
        await liquidityProvidersContract.addTokenLiquidity(request.token, request.amount);
    }

    public async increaseNativeLiquidity(request: IncreaseNativeLiquidityRequest) {
        const liquidityProvidersContract = await this.getLiquidityProvidersContract(request.liquidityProvidersAddress);
        await liquidityProvidersContract.increaseNativeLiquidity(request.nftId, { value: request.amount });
    }

    public async increaseTokenLiquidity(request: IncreaseTokenLiquidityRequest) {
        const liquidityProvidersContract = await this.getLiquidityProvidersContract(request.liquidityProvidersAddress);
        await liquidityProvidersContract.increaseTokenLiquidity(request.nftId, request.amount);
    }

    public async removeLiquidity(request: RemoveLiquidityRequest) {
        const liquidityProvidersContract = await this.getLiquidityProvidersContract(request.liquidityProvidersAddress);
        await liquidityProvidersContract.removeLiquidity(request.nftId, request.amount);
    }

    public async claimFee(request: ClaimFeeRequest) {
        const liquidityProvidersContract = await this.getLiquidityProvidersContract(request.liquidityProvidersAddress);
        await liquidityProvidersContract.claimFee(request.nftId);
    }

    public async getAllPositions(request: GetAllPositionsRequest): Promise<LiquidityPosition[]> {
        const lpTokenContract = await this.getLPTokenContract(request.lpTokenAddress);
        const nftIds: BigNumber[] = await lpTokenContract.getAllNftIdsByUser(request.user);
        let positions: LiquidityPosition[] = [];
        for (const nftId of nftIds) {
            positions.push(await this.getPositionInfo({ lpTokenAddress: request.lpTokenAddress, nftId: nftId.toString() }));
        }

        return positions;
    }

    public async getAccruedFee(request: GetAccruedFeeRequest): Promise<BigNumber> {
        const liquidityProvidersContract = await this.getLiquidityProvidersContract(request.liquidityProvidersAddress);
        return await liquidityProvidersContract.getFeeAccumulatedOnNft(request.nftId);
    }

    public async getPositionInfo(request: GetPositionInfoRequest): Promise<LiquidityPosition> {
        const lpTokenContract = await this.getLPTokenContract(request.lpTokenAddress);
        const positionData = await lpTokenContract.tokenMetadata(request.nftId);

        return {
            token: positionData[0],
            suppliedLiquidity: positionData[1],
            shares: positionData[2],
        };
    }

    private async getLiquidityProvidersContract(address: string): Promise<Contract> {
        return this.getContract({
            address,
            abi: config.liquidityProvidersManagerABI,
            provider: this.provider.getProvider(false),
            networkId: await this.provider.getNetworkId(),
        });
    }

    private async getLPTokenContract(address: string): Promise<Contract> {
        return this.getContract({
            address,
            abi: config.lpTokenABI,
            provider: this.provider.getProvider(false),
            networkId: await this.provider.getNetworkId(),
        });
    }
}

export interface AddNativeLiquidityRequest {
    amount: string,
    liquidityProvidersAddress: string,
}

export interface AddTokenLiquidityRequest {
    token: string,
    amount: string,
    liquidityProvidersAddress: string,
}

export interface IncreaseNativeLiquidityRequest {
    nftId: string,
    amount: string,
    liquidityProvidersAddress: string,
}

export interface IncreaseTokenLiquidityRequest {
    nftId: string,
    amount: string,
    liquidityProvidersAddress: string,
}

export interface RemoveLiquidityRequest {
    nftId: string,
    amount: string,
    liquidityProvidersAddress: string,
}

export interface ClaimFeeRequest {
    nftId: string,
    liquidityProvidersAddress: string,
}

export interface GetAllPositionsRequest {
    user: string,
    lpTokenAddress: string;
}

export interface GetPositionInfoRequest {
    nftId: string,
    lpTokenAddress: string;
}

export interface GetAccruedFeeRequest {
    nftId: string,
    liquidityProvidersAddress: string,
}