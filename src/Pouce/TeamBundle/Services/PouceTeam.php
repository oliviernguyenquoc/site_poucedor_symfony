<?php
namespace Pouce\TeamBundle\Services;

use Doctrine\ORM\EntityManager;
use Doctrine\ORM\NoResultException;
use Pouce\UserBundle\Entity\User;
use Pouce\TeamBundle\Entity\Team;

class PouceTeam
{
	protected $em;

	public function __construct(EntityManager $entityManager)
	{
	    $this->em = $entityManager;
	}

	/**
	* Vérifie que le user est bien dans la team
	*
	* @param Team $team, User $user
	* @return bool
	*
	*/
	public function isATeamOfUser(Team $team, User $user)
    {
        $response = false;
        $users = $team->getUsers();
        if(in_array($user,$users->toArray()))
        {
        	$response = true;
        }

        return $response;
    }                        


	/**
	* Vérifie si le user est inscrit à la prochaine édition du pouce d'or auquel son école est inscrite
	*
	* @param User $user
	* @return bool
	*/
	public function isRegisterToNextRaceOfItsSchool(User $user)
	{

		try
		{
			$team = $this->em -> getRepository('PouceTeamBundle:Team')->getLastTeam($user->getId())->getSingleResult();
		} 
		catch (NoResultException $e) 
		{
			return false;
		}

		try
		{
			$this->em->getRepository('PouceSiteBundle:Edition')->findNextEditionByUserSchool($user)->getSingleResult();
		}
		catch (NoResultException $e) 
		{
			return false;
		}

		if($team->getEdition()->getId() == $nextEdition->getId())
		{
			$answer = true;
		}
		else
		{
			$answer = false;
		}

		return $answer;
	}

	/**
	* Vérifie si le user était inscrit à une course précédente (et pas inscrit dans une prochaine course) ou qui est en train de se dérouler
	*
	* @param User $user
	* @return bool
	*/
	public function isRegisterToPreviousRace(User $user)
	{
		if(self::isRegisterToNextRaceOfItsSchool($user))
		{
			return false;
		}
		else
		{
			try
			{
				$team = $this->em -> getRepository('PouceTeamBundle:Team')->getLastTeam($user->getId())->getSingleResult();
			} 
			catch (NoResultException $e) 
			{
				return false;
			}

			$previousEdition = $this->em -> getRepository('PouceSiteBundle:Edition')->findPreviousOrCurrentEditionByUserSchool($user);

			if($team->getEdition()->getId() == $previousEdition->getId())
			{
				$answer = true;
			}
			else
			{
				$answer = false;
			}
		}

		return $answer;
	}

	/**
	* Vérifie s'il y a une prochaine course de prévue
	*
	* @param User $user
	* @return bool
	*/
	public function isThereNextRace(User $user)
	{
		$nextEditionQuery = $this->em -> getRepository('PouceSiteBundle:Edition')->findNextEditionByUserSchool($user);
		
		try
		{
			$nextEditionQuery->getSingleResult();
		}
		catch(NoResultException $e) 
		{

			return false;
		}
		
		$answer=true;
		
		return $answer;
	}

	/**
	* Vérifie si la team a un result partiel ou non (si une distance est enregistré)
	*
	* @param Team $team
	* @return bool
	*/
	public function isResultSet(Team $team)
	{
		try
		{
			$result = $this->em -> getRepository('PouceTeamBundle:Result')->getResultTeam($team)->getSingleResult();
		}
		catch (NoResultException $e) 
		{
			return false;
		}

		if($result->getPosition()==NULL)
		{
			$answer=false;
		}
		else
		{
			$answer=true;
		}
		return $answer;
	}

	/**
	* Vérifie si la team a un result complet ou non (si un récit (ou "comment") est enregistré)
	*
	* @param Team $team
	* @return bool
	*/
	public function isResultSetCompletely(Team $team)
	{
		try
		{
			$result = $this->em -> getRepository('PouceTeamBundle:Result')->getResultTeam($team)->getSingleResult();
		}
		catch (NoResultException $e) 
		{
			return false;
		}

		if($result->getComment()==NULL)
		{
			$answer=false;
		}
		else
		{
			$answer=true;
		}
		return $answer;
	}
}
